const BASE_URL = 'http://localhost:5000';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function handleResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) {
            // Clear invalid or expired token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
        }
        const errorMessage = data.message || data.error || (data.errors ? data.errors.join(', ') : `HTTP error: ${response.status}`);
        throw new Error(errorMessage);
    }
    return data;
}

/* ================= Authentication API Calls ================= */

export const registerUser = async ({ name, email, password }) => {
    const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    return handleResponse(response);
};

export const loginUser = async ({ email, password }) => {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
};

export const getMe = async () => {
    const response = await fetch(`${BASE_URL}/me`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

/* ================= Task CRUD API Calls (Protected) ================= */

export const getTasks = async () => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const getTaskById = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const createTask = async (taskData) => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
    });
    return handleResponse(response);
};

export const updateTask = async (id, taskData) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
    });
    return handleResponse(response);
};

export const deleteTask = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};
