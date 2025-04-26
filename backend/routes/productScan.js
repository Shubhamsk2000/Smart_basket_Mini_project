
const express = require('express');
const router = express.Router();
// const axios = require('axios'); // Not needed for the /:barcode route
// const fs = require('fs');       // Not needed for the /:barcode route
// const path = require('path');   // Not needed for the /:barcode route
// const FormData = require('form-data'); // Not needed for the /:barcode route
const Products = require('../models/Products'); // Import your Mongoose model

// --- Socket.IO Instance ---
// This variable will hold the socket instance passed from server.js
let ioSocket = null; // Use this single variable

// --- Set Socket Function ---
// This function will be called from server.js to inject the socket instance
const setSocket = (socket) => {
  console.log('[Route] Socket instance received in productScan route.');
  ioSocket = socket; // Store the connected socket instance
};

// --- Database Lookup Function ---
// Finds product using the Mongoose model
const findProductByBarcode = async (barcode) => {
  console.log(`[DB] Searching for barcode: ${barcode}`);
  try {
    // Use await as Products.findOne is asynchronous
    const product = await Products.findOne({ barcode: barcode });
    if (product) {
      console.log(`[DB] Found product: ${product.name}`);
      // Ensure the product object is returned in a usable format
      // .lean() can be useful if you just need the plain JS object
      // return await Products.findOne({ barcode: barcode }).lean();
      return product; // Returning the Mongoose document is usually fine
    } else {
      console.log(`[DB] Product not found for barcode: ${barcode}`);
      return null; // Return null explicitly if not found
    }
  } catch (error) {
    console.error(`[DB] Error during findOne for barcode ${barcode}:`, error);
    throw error; // Re-throw the error to be caught by the route handler
  }
};

// router.post('/scan', async (req, res) => {
//   if (!req.files || !req.files.image) {
//     return res.status(400).send('No image uploaded');
//   }

//   const image = req.files.image;
//   const savePath = path.join(__dirname, '..', 'uploads', image.name);

//   try {
//     await image.mv(savePath);
//     console.log('📸 Image saved:', savePath);
//   } catch (err) {
//     console.error('❌ Save error:', err.message);
//     return res.status(500).send('Failed to save image');
//   }

//   // Send to ZXing
//   const form = new FormData();
//   form.append('f', fs.createReadStream(savePath));

//   try {
//     const response = await axios.post('https://zxing.org/w/decode', form, {
//       headers: form.getHeaders(),
//     });

//     const match = response.data.match(/<pre>(.*?)<\/pre>/s);
//     if (!match || !match[1]) return res.status(400).json({ error: "No barcode found in image" });

//     const barcode = match[1].trim();
//     const product = await Products.findOne({ barcode });

//     if (!product) {
//       return res.status(404).json({ error: 'Product not found', barcode });
//     }

//     // Real-time emit
//     if (frontendSocket) {
//       frontendSocket.emit('product_scanned', product);
//     }

//     res.json({ barcode, product });

//     // Optional: delete image after use
//     fs.unlink(savePath, () => { });
//   } catch (err) {
//     console.error('❌ Decode error:', err.message);
//     res.status(500).send('Error decoding barcode');
//   }
// });


// --- Route Definition ---
// POST /api/:barcode
// Expects the barcode to be part of the URL path.

router.post('/:barcode', async (req, res) => {
  const { barcode } = req.params; // Get barcode from URL parameter

  console.log(`[API /:barcode] Received POST request for barcode: ${barcode}`);
  
  // Basic Validation
  if (!barcode) {
    console.log('[API /:barcode] Error: Barcode parameter is missing.');
    return res.status(400).json({ message: 'Barcode parameter is required.' });
  }

  // Check if Socket.IO frontend client is connected
  if (!ioSocket || !ioSocket.connected) { // Also check if socket is actually connected
    console.error('[API /:barcode] Error: Frontend Socket.IO client not connected. Cannot emit event.');
    // Decide if you should still process or return an error.
    // Returning an error might be better as real-time update is expected.
    return res.status(503).json({ message: 'Real-time service unavailable (Frontend client not connected).' });
  }

  try {
    // Find the product using the barcode - CALL THE CORRECT ASYNC FUNCTION
    const product = await findProductByBarcode(barcode); // Use await here!

    if (product) {
      // --- Product Found ---
      console.log(`[API /:barcode] Product found: ${product.name}. Emitting 'product_added'.`);

      // Emit event to the connected frontend socket
      // Make sure product object is serializable (Mongoose documents usually are)
      ioSocket.emit('product_added', product.toObject ? product.toObject() : product); // Use .toObject() for plain JS if needed

      // Send success response back to the device that made the POST request
      res.status(200).json({
        message: 'Product found and sent to frontend.',
        // Send plain object in response too
        product: product.toObject ? product.toObject() : product
      });

    } else {
      // --- Product Not Found ---
      console.log(`[API /:barcode] Product not found for barcode: ${barcode}. Emitting 'product_not_found'.`);

      // Emit event to frontend indicating the product wasn't found
      ioSocket.emit('product_not_found', { barcode: barcode }); // Send the barcode that wasn't found

      // Send 404 response back to the device that made the POST request
      res.status(404).json({
        message: 'Product not found for the given barcode.',
        barcode: barcode
      });
    }
  } catch (error) {
    // Catch errors from findProductByBarcode or other issues
    console.error(`[API /:barcode] Error processing barcode ${barcode}:`, error);
    // Emit a generic error event to the frontend
    if (ioSocket && ioSocket.connected) { // Check connection again before emitting error
        ioSocket.emit('scan_error', { barcode: barcode, message: 'Internal server error during product lookup.' });
    }
    // Send 500 response back to the device that made the POST request
    res.status(500).json({ message: 'Internal server error processing the request.' });
  }
});


// --- Export Router and setSocket function ---
module.exports = { router, setSocket }; // Export the single correct setSocket