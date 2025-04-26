import React from "react";

// Accept 'product', 'removeProduct', and 'decreaseQuantity' as props
const ProductItem = ({ product, removeProduct, decreaseQuantity }) => {
  // Destructure properties from the product object, providing defaults
  const {
    barcode,
    name,
    price = 0,
    image,
    category, // Category isn't displayed in this layout, but kept for potential use
    quantity = 1,
    _id
  } = product;

  // Determine the best unique identifier for keys and actions (_id preferred)
  const identifier = _id || barcode;

  // Calculate the total price for this specific line item (unit price * quantity)
  const lineItemTotal = (Number(price) * Number(quantity)).toFixed(2);

  return (
    <li className="py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 px-2 sm:px-0">
      {/* Left Section: Image and Product Details */}
      <div className="flex items-center flex-grow overflow-hidden mr-2"> {/* Added mr-2 */}
        {/* Product Image */}
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
          <img
            src={image || 'https://via.placeholder.com/64'} // Use a fallback image URL
            alt={name || 'Product Image'}
            className="h-full w-full object-cover object-center"
            // Add error handling for broken image links
            onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/64'; }}
          />
        </div>

        {/* Product Info Text (Name, Quantity Controls, ID) */}
        <div className="ml-4 flex flex-1 flex-col justify-center overflow-hidden">
          {/* Top line: Product Name and Line Item Price */}
          <div className="flex justify-between text-base font-medium text-gray-900 items-center mb-1">
            {/* Product Name */}
            <h3 className="truncate pr-2 font-semibold" title={name}>
              {name || 'Unknown Product'}
            </h3>
            {/* Line Item Total Price */}
            <p className="ml-4 flex-shrink-0 text-right w-20">₹{lineItemTotal}</p>
          </div>

          {/* Bottom line: Quantity Controls and Identifier */}
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            {/* Subtract Button: Display only if quantity > 1 */}
            {quantity > 1 && (
              <button
                onClick={() => decreaseQuantity(identifier)} // Call decreaseQuantity with identifier
                className="p-0.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
                aria-label={`Decrease quantity of ${name || 'item'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
            )}

            {/* Quantity Display: Display only if quantity > 1 */}
            {quantity > 1 && (
              <span className="font-medium text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm">
                Qty: {quantity}
              </span>
            )}

            {/* Identifier (Barcode or _id) */}
            <span className="truncate" title={identifier}>
                {/* Optionally hide ID if quantity is 1 to reduce clutter */}
                {quantity > 1 ? `ID: ${identifier}` : `ID: ${identifier}`}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Remove Button */}
      <div className="ml-auto flex-shrink-0 pl-2"> {/* Use ml-auto to push right, ensure padding */}
        <button
          onClick={() => removeProduct(identifier)} // Call removeProduct with identifier
          className="text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1 transition-colors duration-200"
          aria-label={`Remove ${name || 'item'} entirely`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </li>
  );
};

export default ProductItem;