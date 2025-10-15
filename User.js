const mongoose = require('mongoose');

const CaretakerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { 
        type: String, 
        required: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    email: { 
        type: String, 
        required: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email']
    }
});

// ... UserSchema remains the same ...
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    age: {
        type: Number,
        required: [true, 'Please provide an age'],
    },
    gender: {
        type: String,
        required: [true, 'Please provide a gender'],
        enum: ['male', 'female', 'other'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        unique: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    otp: String,
    otpExpires: Date,
    bloodGroup: String,
    healthConditions: [String],
    doctor: {
        name: String,
        phone: String,
    },
    caretakers: [CaretakerSchema],
    isSetupComplete: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);
module.exports = User;