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

// Practical 10: Event-Driven Architecture with EventEmitter
import taskEvents from './events.js';
import './listeners.js';

// Practical 13: AI Service Integration
import { generateTaskAiSuggestions, checkAiRateLimit } from './aiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'awdf_practical13_jwt_secret_key_d25dit081';

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
   AUTHENTICATION ENDPOINTS
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
   CACHE DEBUG & STATS ENDPOINTS (Practical 9)
   ========================================================================== */

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

let currentTTL = DEFAULT_TTL;
app.post('/cache/ttl', (req, res) => {
    const { ttl } = req.body;
    if (ttl && Number.isInteger(ttl) && ttl > 0) {
        currentTTL = ttl;
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
   AI ASSISTANT ENDPOINT (Practical 13)
   ========================================================================== */

// POST /api/ai/generate-description (Protected & Rate Limited)
app.post('/api/ai/generate-description', authMiddleware, async (req, res, next) => {
    try {
        const { title } = req.body;

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Task title is required to generate AI suggestions.'
            });
        }

        // Supplementary Problem 2: Rate limit verification (1 req per minute per user)
        const rateLimitCheck = checkAiRateLimit(req.user.id);
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                success: false,
                error: rateLimitCheck.error,
                remainingSeconds: rateLimitCheck.remainingSeconds
            });
        }

        // Call AI Service with Graceful Degradation
        const aiResult = await generateTaskAiSuggestions(title.trim());

        res.status(200).json(aiResult);
    } catch (err) {
        console.error('[AI Endpoint Error]:', err.message);
        res.status(200).json({
            success: true,
            title: req.body.title || '',
            description: `Plan, track, and complete: ${req.body.title || 'task'}.`,
            suggestedPriority: 'medium',
            disclaimer: '⚠️ AI Disclaimer: This content is generated by AI. Please review and verify accuracy before submitting.',
            fallback: true,
            source: 'Fallback Emergency Handler'
        });
    }
});

/* ==========================================================================
   TASK ROUTES WITH EVENT-DRIVEN ASYNC PROCESSING (Practical 10)
   ========================================================================== */

// GET All Tasks
app.get('/tasks', authMiddleware, async (req, res, next) => {
    const cacheKey = `tasks_all_${req.user.id}`;

    try {
        const cached = getFromCache(cacheKey);
        if (cached.hit) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(cached.data);
        }

        const tasks = await Task.find({
            $or: [{ user: req.user.id }, { user: { $exists: false } }, { user: null }]
        }).sort({ createdAt: -1 });

        setInCache(cacheKey, tasks, currentTTL);

        res.setHeader('X-Cache', 'MISS');
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});

// GET Single Task
app.get('/tasks/:id', authMiddleware, validateTaskId, async (req, res, next) => {
    const singleCacheKey = `task_item_${req.taskId}`;

    try {
        const cached = getFromCache(singleCacheKey);
        if (cached.hit) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(cached.data);
        }

        const task = await Task.findById(req.taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        setInCache(singleCacheKey, task, currentTTL);

        res.setHeader('X-Cache', 'MISS');
        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
});

// CREATE Task (Practical 10 Main Problem: Emits 'task-created' event asynchronously)
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

        // Main Problem: Log API response timestamp and respond IMMEDIATELY
        const apiResponseTimestamp = new Date().toISOString();
        console.log(`[API RESPONSE SENT] 201 Created sent to client at: ${apiResponseTimestamp}`);
        res.status(201).json(newTask);

        // Emit task-created event asynchronously after sending the response
        taskEvents.emit('task-created', {
            taskId: newTask._id,
            title: newTask.title,
            user: req.user.name || req.user.email || req.user.id,
            timestamp: apiResponseTimestamp
        });
    } catch (err) {
        next(err);
    }
});

// UPDATE Task
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

        invalidateCache([`tasks_all_${req.user.id}`, `task_item_${req.taskId}`]);

        res.status(200).json(updatedTask);
    } catch (err) {
        next(err);
    }
});

// DELETE Task (Supplementary Problem 1: Emits 'task-deleted' event asynchronously)
app.delete('/tasks/:id', authMiddleware, validateTaskId, async (req, res, next) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.taskId);
        if (!deletedTask) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        invalidateCache([`tasks_all_${req.user.id}`, `task_item_${req.taskId}`]);

        // Supplementary Problem 1: Log API response and emit 'task-deleted' event
        const apiResponseTimestamp = new Date().toISOString();
        console.log(`[API RESPONSE SENT] 200 OK (Task deleted) sent to client at: ${apiResponseTimestamp}`);
        res.status(200).json({
            message: 'Task deleted successfully',
            task: deletedTask
        });

        taskEvents.emit('task-deleted', {
            taskId: deletedTask._id,
            title: deletedTask.title,
            user: req.user.name || req.user.email || req.user.id,
            timestamp: apiResponseTimestamp
        });
    } catch (err) {
        next(err);
    }
});

// Supplementary Problem 2: Route to test error listener without server crash
app.post('/tasks/simulate-error', authMiddleware, (req, res) => {
    const errorMsg = req.body.message || 'Simulated failure in background notification listener';
    const apiTime = new Date().toISOString();

    console.log(`[API RESPONSE SENT] 200 OK (Simulated error triggered) at: ${apiTime}`);
    res.status(200).json({
        success: true,
        message: 'Error event emitted to taskEvents listener. API remains healthy and unblocked.',
        timestamp: apiTime
    });

    // Emit error event to error listener
    taskEvents.emit('error', new Error(errorMsg));
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
    console.log(`Practical 10: Event-Driven Background Processing active`);
});
