import React, { useState, useEffect, useRef, useCallback } from "react";
import ProductItem from "./ProductItem.jsx"; // Make sure the path is correct
import { Link } from "react-router-dom";
import io from 'socket.io-client'; // Import socket.io-client

// --- Configuration ---
// Use environment variable for backend URL with a fallback for local development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
console.log("Connecting to Backend URI:", BACKEND_URL);
// Delay in milliseconds before a re-scan increments quantity
const RESCAN_DELAY_MS = 5000;

const Cart = () => {
    // State: Array of product objects in the cart
    // Each object should contain: _id, barcode, name, price, image, quantity, lastScanTime
    const [products, setProducts] = useState([]);

    // State: Calculated total price of items in the cart
    const [total, setTotal] = useState(0);
    // State: Tracks connection status to the Socket.IO server
    const [isConnected, setIsConnected] = useState(false);
    // State: Displays temporary messages (e.g., "Added", "Not Found", "Connected")
    const [statusMessage, setStatusMessage] = useState('');
    // Ref: Holds the persistent Socket.IO client instance across renders
    const socketRef = useRef(null);

    // Effect Hook: Handles Socket.IO connection, event listeners, and cleanup
    useEffect(() => {
        // Establish connection only if socketRef is not already set
        if (!socketRef.current) {
            console.log(`Attempting to connect to Socket.IO at ${BACKEND_URL}`);
            // Connect to the backend server using the URL
            socketRef.current = io(BACKEND_URL, {
                reconnectionAttempts: 5, // Attempt to reconnect 5 times if disconnected
                reconnectionDelay: 3000,  // Wait 3 seconds between reconnection attempts
            });
        }

        // Assign the current socket instance to a variable for easier use
        const socket = socketRef.current;

        // --- Define Socket.IO Event Listeners ---

        // On successful connection
        socket.on('connect', () => {
            console.log('Socket.IO Connected - ID:', socket.id);
            setIsConnected(true); // Update connection status state
            setStatusMessage('Connected to scanner service.'); // Provide user feedback
            setTimeout(() => setStatusMessage(''), 3000); // Clear feedback after 3 seconds
        });

        // On disconnection
        socket.on('disconnect', (reason) => {
            console.log('Socket.IO Disconnected - Reason:', reason);
            setIsConnected(false); // Update connection status state
            setStatusMessage('Scanner service disconnected.'); // Provide user feedback
        });

        // On connection error
        socket.on('connect_error', (error) => {
            console.error('Socket.IO Connection Error:', error);
            setIsConnected(false); // Update connection status state
            setStatusMessage('Error connecting to scanner service.'); // Provide user feedback
        });

        // Listener: When a product is successfully scanned and found in the DB
        socket.on('product_added', (scannedProductData) => {
            console.log('Received product_added:', scannedProductData);
            const currentTime = Date.now(); // Get the current timestamp

            // Update the products state based on the scanned product
            setProducts((prevProducts) => {
                // Find the index of the product if it already exists in the cart
                const existingProductIndex = prevProducts.findIndex(
                    (p) => p.barcode === scannedProductData.barcode || (p._id && p._id === scannedProductData._id)
                );

                // --- Case 1: Product is NEW to the cart ---
                if (existingProductIndex === -1) {
                    setStatusMessage(`Added: ${scannedProductData.name}`);
                    const newProductEntry = {
                        ...scannedProductData, // Include all data from backend
                        quantity: 1,          // Set initial quantity to 1
                        lastScanTime: currentTime, // Record the time it was added
                    };
                    // Return a new array with the new product added at the beginning
                    return [newProductEntry, ...prevProducts];
                }
                // --- Case 2: Product is ALREADY in the cart ---
                else {
                    const existingProduct = prevProducts[existingProductIndex];
                    const timeSinceLastScan = currentTime - existingProduct.lastScanTime;

                    // Check if enough time has passed since the last scan of THIS item
                    if (timeSinceLastScan >= RESCAN_DELAY_MS) {
                        // Time delay passed: Increment quantity
                        const updatedProduct = {
                            ...existingProduct,
                            quantity: existingProduct.quantity + 1, // Increase quantity
                            lastScanTime: currentTime, // Update the last scan time
                        };
                        setStatusMessage(`${updatedProduct.name} quantity updated to ${updatedProduct.quantity}`);

                        // Create a new array, replacing the old item with the updated one
                        const updatedProducts = [...prevProducts];
                        updatedProducts[existingProductIndex] = updatedProduct;
                        return updatedProducts; // Return the modified array
                    } else {
                        // Time delay NOT passed: Ignore this scan for quantity purposes
                        console.log(`Product ${scannedProductData.barcode} scanned again too quickly (${timeSinceLastScan}ms). Ignoring quantity update.`);
                        // Return the previous state unchanged
                        return prevProducts;
                    }
                }
            });
            // Clear status message shortly after adding/updating
            setTimeout(() => setStatusMessage(''), 2500);
        });

        // Listener: When a scanned barcode is not found in the database
        socket.on('product_not_found', (data) => {
            console.warn(`Product not found for barcode: ${data.barcode}`);
            setStatusMessage(`Scanned item (${data.barcode}) not found in database.`);
            setTimeout(() => setStatusMessage(''), 4000); // Show message longer
        });

        // Listener: When a backend error occurs during scanning/lookup
        socket.on('scan_error', (errorData) => {
            console.error('Scan Error:', errorData);
            setStatusMessage(`Error scanning item (${errorData.barcode}): ${errorData.message}`);
            setTimeout(() => setStatusMessage(''), 5000); // Show error longer
        });

        // --- Cleanup Function ---
        // This runs when the component unmounts or before the effect runs again
        return () => {
            console.log('Cleaning up Socket.IO connection and listeners...');
            if (socketRef.current) {
                // Remove all event listeners specific to this component instance
                socket.off('connect');
                socket.off('disconnect');
                socket.off('connect_error');
                socket.off('product_added');
                socket.off('product_not_found');
                socket.off('scan_error');
                // Disconnect the socket connection
                socket.disconnect();
                // Clear the ref to indicate disconnection
                socketRef.current = null;
            }
        };
        // Effect dependencies: Re-run if BACKEND_URL changes (useful if it's dynamic)
    }, [BACKEND_URL]);

    // Effect Hook: Recalculates the total price whenever the `products` array changes
    useEffect(() => {
        // Calculate sum by iterating through products, multiplying price by quantity
        const newTotal = products.reduce((sum, item) => {
            const price = Number(item.price) || 0; // Ensure price is a number
            const quantity = Number(item.quantity) || 0; // Ensure quantity is a number
            return sum + (price * quantity);
        }, 0); // Initial sum is 0
        setTotal(newTotal); // Update the total state
    }, [products]); // Dependency: Run this effect when 'products' state changes

    // Function: Removes a product from the cart entirely
    // Use useCallback to prevent unnecessary re-creation of the function on re-renders
    const removeProduct = useCallback((identifier) => {
        setProducts(prevProducts =>
            // Filter out the product matching the identifier
            prevProducts.filter((product) => product.barcode !== identifier && product._id !== identifier)
        );
        setStatusMessage(`Item removed.`); // Provide user feedback
        setTimeout(() => setStatusMessage(''), 1500); // Clear feedback
    }, []); // Empty dependency array means the function is created once

    // Function: Decreases the quantity of a product by 1
    // Use useCallback for performance optimization
    const decreaseQuantity = useCallback((identifier) => {
        setProducts(prevProducts => {
            const productIndex = prevProducts.findIndex(p => p._id === identifier || p.barcode === identifier);

            // If product not found, or quantity is already 1 (or less), do nothing
            if (productIndex === -1 || prevProducts[productIndex].quantity <= 1) {
                return prevProducts; // Return the state unchanged
            }

            // Create a new array for state update (immutability)
            const updatedProducts = [...prevProducts];
            // Create a new object for the product being updated (immutability)
            const updatedProduct = {
                ...updatedProducts[productIndex], // Copy existing properties
                quantity: updatedProducts[productIndex].quantity - 1, // Decrease quantity
            };
            // Replace the old product object with the updated one in the new array
            updatedProducts[productIndex] = updatedProduct;

            setStatusMessage(`${updatedProduct.name} quantity decreased to ${updatedProduct.quantity}`);
            setTimeout(() => setStatusMessage(''), 1500);

            return updatedProducts; // Return the new array to update state
        });
    }, []); // Empty dependency array

    // Function: Handles the checkout process (currently shows an alert)
    const handleCheckout = () => {
        // Calculate total quantity for the alert message
        const totalQuantity = products.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        alert(`Checkout initiated with ${products.length} unique items (total quantity: ${totalQuantity}) for ₹${total.toFixed(2)}`);
        // Future: Implement actual API call for checkout
    };

    // --- JSX Rendering ---
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900">Your Shopping Cart</h1>
                    <div className="flex items-center space-x-4">
                        {/* Connection Status Indicator */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800 animate-pulse' // Add pulse when disconnected
                            }`}>
                            {isConnected ? '● Connected' : '● Disconnected'}
                        </span>
                        {/* Link to go back (adjust route if needed) */}
                        <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Continue Shopping
                        </Link>
                    </div>
                </div>

                {/* Status Message Display Area */}
                {statusMessage && (
                    <div className="mb-4 p-3 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-md text-center text-sm transition-opacity duration-300 shadow-sm" role="alert">
                        {statusMessage}
                    </div>
                )}

                {/* Cart Content Area */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="p-6">
                        {/* Cart Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Scanned Products</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {products.length} {products.length === 1 ? 'unique item' : 'unique items'}
                            </span>
                        </div>

                        {/* Conditional Rendering: Empty Cart vs. Product List */}
                        {products.length === 0 ? (
                            // Display when cart is empty
                            <div className="text-center py-12">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="mt-4 text-lg text-gray-500">Your cart is empty</p>
                                <p className="text-sm text-gray-400">Waiting for scanned products...</p>
                            </div>
                        ) : (
                            // Display when cart has items
                            <>
                                {/* List of Products */}
                                <ul className="divide-y divide-gray-200">
                                    {/* Map through products array and render ProductItem for each */}
                                    {products.map((product) => (
                                        <ProductItem
                                            key={product._id || product.barcode} // Use unique ID (_id preferred)
                                            product={product} // Pass the entire product object
                                            removeProduct={removeProduct} // Pass remove function
                                            decreaseQuantity={decreaseQuantity} // Pass decrease quantity function
                                        />
                                    ))}
                                </ul>

                                {/* Totals and Checkout Section */}
                                <div className="mt-8 border-t border-gray-200 pt-6">
                                    {/* Subtotal */}
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-base text-gray-600">Subtotal</span>
                                        <span className="text-base font-medium text-gray-900">₹{total.toFixed(2)}</span>
                                    </div>
                                    {/* Shipping (Example) */}
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-base text-gray-600">Shipping</span>
                                        <span className="text-base font-medium text-gray-900">Free</span>
                                    </div>
                                    {/* Grand Total */}
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-lg font-bold text-gray-900">Total</span>
                                        <span className="text-xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
                                    </div>

                                    {/* Checkout Button */}
                                    <button
                                        onClick={handleCheckout}
                                        disabled={products.length === 0} // Disable if cart is empty
                                        className={`w-full text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center ${products.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer' // Change style when disabled
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Secure Checkout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;