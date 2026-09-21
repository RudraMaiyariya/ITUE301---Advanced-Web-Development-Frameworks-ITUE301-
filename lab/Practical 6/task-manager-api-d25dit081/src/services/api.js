const BASE_URL = 'http://localhost:5000';

async function handleResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }
    return data;
}

export const getTasks = async () => {
    const response = await fetch(`${BASE_URL}/tasks`);
    return handleResponse(response);
};

export const getTaskById = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`);
    return handleResponse(response);
};

export const createTask = async (taskData) => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
    });
    return handleResponse(response);
};

export const updateTask = async (id, taskData) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
    });
    return handleResponse(response);
};

export const deleteTask = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE'
    });
    return handleResponse(response);
};
