import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Task from './models/Task.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

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

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task-manager-api')
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/', (req, res) => {
    res.json({ message: 'Task Management API is running. Use /tasks to access endpoints.' });
});

app.get('/tasks', async (req, res, next) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});

app.get('/tasks/:id', validateTaskId, async (req, res, next) => {
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

app.post('/tasks', async (req, res, next) => {
    try {
        const { title, description, completed, priority } = req.body;

        const newTask = await Task.create({
            title,
            description: description || '',
            completed: completed ?? false,
            priority: priority || 'medium'
        });

        res.status(201).json(newTask);
    } catch (err) {
        next(err);
    }
});

app.put('/tasks/:id', validateTaskId, async (req, res, next) => {
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

app.delete('/tasks/:id', validateTaskId, async (req, res, next) => {
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

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route Not Found',
        message: `The endpoint ${req.method} ${req.url} does not exist.`
    });
});

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
            message: 'Invalid task ID format'
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
