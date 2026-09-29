import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Task from './models/Task.js';
import User from './models/User.js';
import authMiddleware from './middleware/auth.js';
import { validateRegister, validateLogin, validateTaskInput } from './middleware/validation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'awdf_practical7_jwt_secret_key_d25dit081';

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Enforce Content-Type for POST and PUT
const checkContentType = (req, res, next) => {
    if (['POST', 'PUT'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request: Content-Type header must be application/json'
            });
        }
    }
    next();
};

app.use(checkContentType);

// Validate MongoDB ObjectId parameter
const validateTaskId = (req, res, next) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid Task ID format. Task ID must be a valid MongoDB ObjectId.'
        });
    }

    req.taskId = id;
    next();
};

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task-manager-api')
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/', (req, res) => {
    res.json({ message: 'Task Management API with JWT Authentication is running.' });
});

/* ==========================================================================
   AUTHENTICATION ROUTES (Practical 7)
   ========================================================================== */

// 1. User Registration (Password Hashing via bcrypt)
app.post('/register', validateRegister, async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email address already exists.'
            });
        }

        // Hash password with salt rounds = 10
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (err) {
        next(err);
    }
});

// 2. User Login (Password Comparison & JWT Token Signing)
app.post('/login', validateLogin, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Compare plain password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Sign JWT Token with 1-hour expiration
        const token = jwt.sign(
            { id: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
});

// 3. Current User Profile (/me)
app.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (err) {
        next(err);
    }
});

/* ==========================================================================
   PROTECTED TASK ROUTES (Protected by authMiddleware & validateTaskInput)
   ========================================================================== */

// GET All Tasks (Protected)
app.get('/tasks', authMiddleware, async (req, res, next) => {
    try {
        const tasks = await Task.find({
            $or: [{ user: req.user.id }, { user: { $exists: false } }, { user: null }]
        }).sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});

// GET Single Task (Protected)
app.get('/tasks/:id', authMiddleware, validateTaskId, async (req, res, next) => {
    try {
        const task = await Task.findById(req.taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
});

// CREATE Task (Protected with Input Validation)
app.post('/tasks', authMiddleware, validateTaskInput, async (req, res, next) => {
    try {
        const { title, description, completed, priority } = req.body;

        const newTask = await Task.create({
            title: title.trim(),
            description: description || '',
            completed: completed ?? false,
            priority: priority || 'medium',
            user: req.user.id
        });

        res.status(201).json(newTask);
    } catch (err) {
        next(err);
    }
});

// UPDATE Task (Protected with Input Validation)
app.put('/tasks/:id', authMiddleware, validateTaskId, validateTaskInput, async (req, res, next) => {
    try {
        const task = await Task.findById(req.taskId);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        const updatedTask = await Task.findByIdAndUpdate(req.taskId, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json(updatedTask);
    } catch (err) {
        next(err);
    }
});

// DELETE Task (Protected)
app.delete('/tasks/:id', authMiddleware, validateTaskId, async (req, res, next) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.taskId);

        if (!deletedTask) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        res.status(200).json({
            message: 'Task deleted successfully',
            task: deletedTask
        });
    } catch (err) {
        next(err);
    }
});

app.get('/error-test', (req, res, next) => {
    const err = new Error('Test server error');
    next(err);
});

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route Not Found',
        message: `The endpoint ${req.method} ${req.url} does not exist.`
    });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        const errors = {};
        Object.keys(err.errors).forEach((field) => {
            errors[field] = err.errors[field].message;
        });

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong'
    });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export { app };
