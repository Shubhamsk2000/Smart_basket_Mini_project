const express = require('express');
const fileUpload = require('express-fileupload');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');

// Models & Routes
const { router: productScanRoute, setSocket } = require('./routes/productScan');

// Init
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] }
});
// Middleware
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static('uploads'));
app.use(cors())

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('📡 Frontend connected');
  setSocket(socket);
});

// DB + Routes
connectDB();
app.use('/api', productScanRoute);

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
