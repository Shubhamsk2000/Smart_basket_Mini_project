const mongoose = require('mongoose');
const mongo_uri = process.env.MONGODB_URI 

const connectDB = async () => {
    try {
        
        await mongoose.connect(mongo_uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌MongoDB connection failed:", error);
        process.exit(1);
    }
};

module.exports = connectDB;
