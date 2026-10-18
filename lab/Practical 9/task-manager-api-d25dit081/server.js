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
import cache, { getFromCache, setInCache, invalidateCache, cacheStats, DEFAULT_TTL } from './cache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'awdf_practical9_jwt_secret_key_d25dit081';

app.use(cors());
app.use(express.json());

// Accurate response-time header middleware
app.use((req, res, next) => {
    const start = process.hrtime();
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        const diff = process.hrtime(start);
        const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        res.setHeader('X-Response-Time', `${timeMs}ms`);
        return originalJson(body);
    };
    next();
});

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
    .then(() => console.log('Connected to MongoDB successfully.'))
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

/* ==========================================================================
   AUTHENTICATION ENDPOINTS (Practical 7)
   ========================================================================== */

// 1. User Registration
app.post('/auth/register', validateRegister, async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email already exists.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, name: newUser.name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            token,
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

// 2. User Login
app.post('/auth/login', validateLogin, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

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
   CACHE DEBUG & STATS ENDPOINTS (Supplementary Problem 2 & 3)
   ========================================================================== */

// Supplementary Problem 2: Expose cache-hit/cache-miss counter and stats
app.get('/cache/stats', (req, res) => {
    const totalRequests = cacheStats.hits + cacheStats.misses;
    res.status(200).json({
        success: true,
        stats: {
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            totalRequests,
            hitRate: cacheStats.getHitRate(),
            invalidations: cacheStats.invalidations,
            activeCachedKeys: cache.keys(),
            defaultTTL: DEFAULT_TTL
        }
    });
});

// Supplementary Problem 3: Test TTL configuration and staleness vs performance
let currentTTL = DEFAULT_TTL;
app.post('/cache/ttl', (req, res) => {
    const { ttl } = req.body;
    if (ttl && Number.isInteger(ttl) && ttl > 0) {
        currentTTL = ttl;
        // Invalidate all existing cache keys to apply new TTL
        cache.flushAll();
        return res.status(200).json({
            success: true,
            message: `Cache TTL updated to ${currentTTL} seconds. Cache flushed.`,
            currentTTL
        });
    }
    return res.status(400).json({ success: false, error: 'Valid positive integer TTL required.' });
});

/* ==========================================================================
   PROTECTED TASK ROUTES WITH IN-MEMORY CACHING (Practical 9)
   ========================================================================== */

// GET All Tasks (Main Problem: Cache with 60s TTL)
app.get('/tasks', authMiddleware, async (req, res, next) => {
    const cacheKey = `tasks_all_${req.user.id}`;

    try {
        // Step 1: Check in-memory cache
        const cached = getFromCache(cacheKey);
        if (cached.hit) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(cached.data);
        }

        // Step 2: Cache Miss - Query MongoDB
        const tasks = await Task.find({
            $or: [{ user: req.user.id }, { user: { $exists: false } }, { user: null }]
        }).sort({ createdAt: -1 });

        // Step 3: Store in cache with current TTL
        setInCache(cacheKey, tasks, currentTTL);

        res.setHeader('X-Cache', 'MISS');
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});

// GET Single Task (Supplementary Problem 1: Separate cache per single task)
app.get('/tasks/:id', authMiddleware, validateTaskId, async (req, res, next) => {
    const singleCacheKey = `task_item_${req.taskId}`;

    try {
        // Check single-task cache
        const cached = getFromCache(singleCacheKey);
        if (cached.hit) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(cached.data);
        }

        // Cache Miss - Query MongoDB
        const task = await Task.findById(req.taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Store single task in cache
        setInCache(singleCacheKey, task, currentTTL);

        res.setHeader('X-Cache', 'MISS');
        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
});

// CREATE Task (Invalidates all tasks cache)
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

        // Invalidate cache on write
        invalidateCache(`tasks_all_${req.user.id}`);

        res.status(201).json(newTask);
    } catch (err) {
        next(err);
    }
});

// UPDATE Task (Invalidates both all tasks cache and specific single task cache)
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

        // Invalidate both caches on write
        invalidateCache([`tasks_all_${req.user.id}`, `task_item_${req.taskId}`]);

        res.status(200).json(updatedTask);
    } catch (err) {
        next(err);
    }
});

// DELETE Task (Invalidates both all tasks cache and specific single task cache)
app.delete('/tasks/:id', authMiddleware, validateTaskId, async (req, res, next) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.taskId);
        if (!deletedTask) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Invalidate both caches on write
        invalidateCache([`tasks_all_${req.user.id}`, `task_item_${req.taskId}`]);

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
        error: 'Route not found'
    });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: Object.values(err.errors).map((e) => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Cast Error: Invalid data format or identifier.'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Practical 9: In-Memory Caching initialized (Default TTL: ${DEFAULT_TTL}s)`);
});
