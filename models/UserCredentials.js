const mongoose = require('mongoose');

const userCredentialsSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Trainer', 'Employee'],
        default: 'Employee'
    },
    userId: {
        type: String, // ID of the user in the User Service
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('UserCredentials', userCredentialsSchema);
