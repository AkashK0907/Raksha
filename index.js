const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

dotenv.config({ path: './.env' });
const app = express();

app.use(cors());
app.use(express.json());

const connectDB = async () => {
    try {
        // The options are no longer needed
        await mongoose.connect(process.env.MONGO_URI); 
        console.log('MongoDB Connected successfully!');
    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1);
    }
};
connectDB();

// Backend API routes
app.use('/api/auth', require('./routes/authRoutes'));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Raksha.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
