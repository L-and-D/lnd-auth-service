const UserCredentials = require('../models/UserCredentials');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const axios = require('axios'); // We need axios for inter-service comms

const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Admin', 'Trainer', 'Employee').default('Employee'),
    department: Joi.string().allow('', null)
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.register = async (req, res, next) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, email, password, role, department } = value;

        const existingUser = await UserCredentials.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Call User Service to create the profile
        let userId;
        try {
            const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
            const profileResponse = await axios.post(`${userServiceUrl}/internal/users`, {
                name,
                email,
                role,
                department
            });
            userId = profileResponse.data._id;
        } catch (err) {
            console.error('Error calling User Service:', err.message);
            return res.status(500).json({ message: 'Failed to create user profile in User Service' });
        }

        // Hash password and save credentials
        const hashedPassword = await bcrypt.hash(password, 10);
        const newCredentials = new UserCredentials({
            email,
            password: hashedPassword,
            role,
            userId
        });

        await newCredentials.save();

        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { email, password } = value;

        const user = await UserCredentials.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.userId, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'supersecret',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.userId, role: user.role, email: user.email }
        });
    } catch (error) {
        next(error);
    }
};

// Optional verify route for internal or explicit checks
exports.verifyTokenRoute = (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'No token' });

    jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        res.json({ valid: true, user: decoded });
    });
};
