import express from 'express';

const app = express();
const PORT = 5000;

// Step 2: Built-in Middleware to parse JSON bodies
app.use(express.json());

// Step 3: Request logging middleware applied globally
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// SUPPLEMENTARY PROBLEM 1: Content-Type Validation Middleware
// Rejects POST/PUT requests without Content-Type: application/json
const checkContentType = (req, res, next) => {
    if (['POST', 'PUT'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                error: 'Bad Request: Content-Type header must be application/json'
            });
        }
    }
    next();
};

app.use(checkContentType);

// SUPPLEMENTARY PROBLEM 2: Route-Specific Task ID Validation Middleware
// Validates ID format before reaching controller
const validateTaskId = (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid Task ID format. Task ID must be a positive integer.'
        });
    }
    req.taskId = id;
    next();
};

// Step 4: In-memory array for task storage
let tasks = [
    { id: 1, title: 'Complete Practical 4', description: 'Build Node/Express REST API', completed: true },
    { id: 2, title: 'Submit Assignment', description: 'Test API with Postman', completed: false }
];
let nextId = 3;

// Root Route
app.get('/', (req, res) => {
    res.json({ message: 'Task Management API is running. Use /tasks to access endpoints.' });
});

// CRUD Endpoint 1: GET /tasks (Read All Tasks)
app.get('/tasks', (req, res) => {
    res.status(200).json(tasks);
});

// CRUD Endpoint 2: GET /tasks/:id (Read Task by ID with route-specific ID validation)
app.get('/tasks/:id', validateTaskId, (req, res) => {
    const task = tasks.find(t => t.id === req.taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(task);
});

// CRUD Endpoint 3: POST /tasks (Create Task)
app.post('/tasks', (req, res) => {
    const { title, description, completed } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    const newTask = {
        id: nextId++,
        title: title.trim(),
        description: description || '',
        completed: completed || false
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// CRUD Endpoint 4: PUT /tasks/:id (Update Task with route-specific ID validation)
app.put('/tasks/:id', validateTaskId, (req, res) => {
    const task = tasks.find(t => t.id === req.taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, completed } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;

    res.status(200).json(task);
});

// CRUD Endpoint 5: DELETE /tasks/:id (Delete Task with route-specific ID validation)
app.delete('/tasks/:id', validateTaskId, (req, res) => {
    const taskIndex = tasks.findIndex(t => t.id === req.taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];
    res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
});

// Test Route to simulate error for Global Error Handler
app.get('/error-test', (req, res, next) => {
    const err = new Error('Test server error');
    next(err);
});

// SUPPLEMENTARY PROBLEM 3: Structured 404 Handler for Undefined Routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Route Not Found',
        message: `The endpoint ${req.method} ${req.url} does not exist.`
    });
});

// Step 5: Global error handling middleware (MUST be defined last)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong', details: err.message });
});

// Start Server on Port 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
