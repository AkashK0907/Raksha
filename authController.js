const path = require('path');
const User = require('../models/User'); // Simpler require path
const jwt = require('jsonwebtoken');
const twilioClient = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const sendOTP = async (phone, otp) => {
    try {
        await twilioClient.messages.create({
            body: `Your Raksha verification code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${phone}` // Automatically adds the Indian country code
        });
        console.log(`OTP sent successfully to ${phone}.`);
    } catch (error) {
        console.error('Failed to send OTP via Twilio:', error.message);
        throw new Error('Failed to send OTP via SMS.');
    }
};
exports.register = async (req, res) => {
    try {
        const { name, age, gender, phone } = req.body;

        let user = await User.findOne({ phone });
        if (user) {
            return res.status(400).json({ message: 'User with this phone number already exists' });
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user = new User({
            name,
            age,
            gender,
            phone,
            otp,
            otpExpires
        });

        await user.save();
        await sendOTP(phone, otp);

        res.status(201).json({ message: 'User registered successfully. OTP sent to your phone.', phone });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.login = async (req, res) => {
    try {
        const { phone } = req.body;

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register first.' });
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOTP(phone, otp);

        res.status(200).json({ message: 'OTP sent successfully.', phone });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        const user = await User.findOne({
            phone,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                isSetupComplete: user.isSetupComplete
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.completeSetup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bloodGroup, healthConditions, doctor, caretakers } = req.body;
        if (!caretakers || caretakers.length === 0) {
            return res.status(400).json({ message: 'At least one caretaker is required.' });
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {
            bloodGroup,
            healthConditions,
            doctor,
            caretakers,
            isSetupComplete: true
        }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            message: 'Profile setup complete!',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};