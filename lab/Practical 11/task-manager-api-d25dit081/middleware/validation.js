export const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters long.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
        errors.push('A valid email address is required.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || typeof email !== 'string' || !email.trim()) {
        errors.push('Email is required.');
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
        errors.push('Password is required.');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

export const validateTaskInput = (req, res, next) => {
    const { title, priority } = req.body;
    const errors = [];

    if (req.method === 'POST' || (req.method === 'PUT' && title !== undefined)) {
        if (!title || typeof title !== 'string' || !title.trim()) {
            errors.push('Task title is required and cannot be empty.');
        }
    }

    if (priority !== undefined) {
        const allowed = ['low', 'medium', 'high'];
        if (!allowed.includes(priority)) {
            errors.push(`Priority must be one of: ${allowed.join(', ')}.`);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};
