import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getTasks, createTask, updateTask, deleteTask, loginUser, registerUser, getMe, generateAiDescription } from '../services/api';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

// Supplementary Problem 1: Lazy loading a heavy component only when required
const TaskAnalyticsChart = lazy(() => import('./TaskAnalyticsChart'));

const Spinner = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{
            display: 'inline-block',
            width: '32px',
            height: '32px',
            border: '3px solid #27272a',
            borderRadius: '50%',
            borderTopColor: '#3b82f6',
            animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>
            {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
        <p style={{ marginTop: '12px', color: '#71717a', fontSize: '13px' }}>Loading tasks...</p>
    </div>
);

const ErrorMessage = ({ message, onRetry }) => (
    <div style={{
        textAlign: 'center',
        padding: '24px',
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '8px',
        margin: '20px 0'
    }}>
        <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#ef4444' }}>
            {message || 'Unable to connect to server.'}
        </p>
        {onRetry && (
            <button
                onClick={onRetry}
                style={{
                    padding: '6px 14px',
                    backgroundColor: '#27272a',
                    color: '#e4e4e7',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                }}
            >
                Retry
            </button>
        )}
    </div>
);

function Projects() {
    // Authentication State
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
    const [authName, setAuthName] = useState('');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authSubmitting, setAuthSubmitting] = useState(false);

    // Tasks State
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form inputs
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');

    // Practical 13: AI State Management
    const [aiLoading, setAiLoading] = useState(false);
    const [aiDisclaimer, setAiDisclaimer] = useState('');
    const [aiError, setAiError] = useState(null);

    // Filter: 'all' | 'pending' | 'completed'
    const [filter, setFilter] = useState('all');

    // Supplementary Problem 1: Toggle lazy analytics
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Editing State
    const [editingTask, setEditingTask] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPriority, setEditPriority] = useState('medium');

    // Delete Modal
    const [taskToDelete, setTaskToDelete] = useState(null);

    // Toast
    const [toast, setToast] = useState({ message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const fetchTasks = async () => {
        if (!localStorage.getItem('token')) {
            setTasks([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Error fetching tasks');
            if (err.message && err.message.toLowerCase().includes('token')) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = (message = 'Logged out') => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setTasks([]);
        if (message) showToast(message);
    };

    // Supplementary Problem 2: Listen for 401 Unauthorized / Token Expiry
    useEffect(() => {
        const handleUnauthorized = () => {
            handleLogout('Session expired. Please log in again.');
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);

        // Supplementary Problem 1: Verify token with /me on initial mount
        const token = localStorage.getItem('token');
        if (token) {
            getMe()
                .then(res => {
                    setUser(res.user);
                    localStorage.setItem('user', JSON.stringify(res.user));
                })
                .catch(() => {
                    handleLogout('Session expired. Please log in again.');
                });
        }

        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user]);

    // Handle Auth Submission (Register / Login)
    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthSubmitting(true);
        try {
            if (authMode === 'register') {
                const res = await registerUser({
                    name: authName.trim(),
                    email: authEmail.trim(),
                    password: authPassword
                });
                showToast('Registration successful! Please log in.');
                setAuthMode('login');
                setAuthPassword('');
            } else {
                const res = await loginUser({
                    email: authEmail.trim(),
                    password: authPassword
                });
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                setUser(res.user);
                setAuthEmail('');
                setAuthPassword('');
                showToast(`Welcome back, ${res.user.name}!`);
            }
        } catch (err) {
            showToast(err.message || 'Authentication failed', 'error');
        } finally {
            setAuthSubmitting(false);
        }
    };

    // Optimistic UI Create Task
    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticTask = {
            _id: tempId,
            title: title.trim(),
            description: description.trim(),
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        const taskPayload = {
            title: title.trim(),
            description: description.trim(),
            priority
        };

        // 1. Immediately show new task in UI before server responds
        setTasks(prev => [optimisticTask, ...prev]);
        setTitle('');
        setDescription('');
        setPriority('medium');

        try {
            // 2. Persist to MongoDB
            const created = await createTask(taskPayload);
            // 3. Replace temp task with confirmed DB document
            setTasks(prev => prev.map(t => t._id === tempId ? created : t));
            showToast('Task created');
        } catch (err) {
            // 4. Rollback if server fails
            setTasks(prev => prev.filter(t => t._id !== tempId));
            showToast(err.message || 'Failed to create task', 'error');
        }
    };

    const handleToggleComplete = async (task) => {
        try {
            const updated = await updateTask(task._id, { completed: !task.completed });
            setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
        } catch (err) {
            showToast(err.message || 'Failed to update task', 'error');
        }
    };

    const handleStartEdit = (task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDescription(task.description || '');
        setEditPriority(task.priority || 'medium');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editTitle.trim()) return;

        try {
            const updated = await updateTask(editingTask._id, {
                title: editTitle.trim(),
                description: editDescription.trim(),
                priority: editPriority
            });
            setTasks(prev => prev.map(t => t._id === editingTask._id ? updated : t));
            setEditingTask(null);
            showToast('Task updated');
        } catch (err) {
            showToast(err.message || 'Failed to save changes', 'error');
        }
    };

    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;
        try {
            await deleteTask(taskToDelete._id);
            setTasks(prev => prev.filter(t => t._id !== taskToDelete._id));
            showToast('Task deleted');
        } catch (err) {
            showToast(err.message || 'Failed to delete task', 'error');
        } finally {
            setTaskToDelete(null);
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'completed') return t.completed;
        if (filter === 'pending') return !t.completed;
        return true;
    });

    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = tasks.length - completedCount;

    const renderPriorityIndicator = (p) => {
        const config = {
            high: { color: '#f87171', dot: '#ef4444', label: 'High' },
            low: { color: '#34d399', dot: '#10b981', label: 'Low' },
            medium: { color: '#fbbf24', dot: '#f59e0b', label: 'Medium' }
        }[p] || { color: '#a1a1aa', dot: '#71717a', label: 'Medium' };

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: config.color,
                fontWeight: '500'
            }}>
                <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: config.dot
                }}></span>
                {config.label}
            </span>
        );
    };

    return (
        <section className="section" style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 20px' }}>
            {/* Header with Auth Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', color: '#f4f4f5', margin: 0, fontWeight: '600', letterSpacing: '-0.3px' }}>
                    Tasks
                </h2>

                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '13px', color: '#a1a1aa' }}>
                            {user.name} <span style={{ color: '#52525b' }}>({user.email})</span>
                        </span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            style={{
                                padding: '5px 12px',
                                border: '1px solid #3f3f46',
                                borderRadius: '6px',
                                background: '#27272a',
                                color: '#e4e4e7',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Sign out
                        </button>
                    </div>
                )}
            </div>

            {/* Authentication Form if NOT logged in */}
            {!user ? (
                <div style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '28px',
                    maxWidth: '420px',
                    margin: '30px auto',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #27272a', marginBottom: '20px' }}>
                        <button
                            type="button"
                            onClick={() => setAuthMode('login')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: authMode === 'login' ? '2px solid #3b82f6' : 'none',
                                color: authMode === 'login' ? '#f4f4f5' : '#71717a',
                                fontWeight: '500',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            onClick={() => setAuthMode('register')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: authMode === 'register' ? '2px solid #3b82f6' : 'none',
                                color: authMode === 'register' ? '#f4f4f5' : '#71717a',
                                fontWeight: '500',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleAuthSubmit}>
                        {authMode === 'register' && (
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Name</label>
                                <input
                                    type="text"
                                    className="task-form-input"
                                    value={authName}
                                    onChange={(e) => setAuthName(e.target.value)}
                                    placeholder="Your Name"
                                    required
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Email</label>
                            <input
                                type="email"
                                className="task-form-input"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Password</label>
                            <input
                                type="password"
                                className="task-form-input"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder={authMode === 'register' ? 'Minimum 6 characters' : 'Enter password'}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={authSubmitting}
                            style={{
                                width: '100%',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                padding: '10px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: authSubmitting ? 'not-allowed' : 'pointer',
                                opacity: authSubmitting ? 0.7 : 1
                            }}
                        >
                            {authSubmitting ? 'Processing...' : (authMode === 'login' ? 'Sign in' : 'Create Account')}
                        </button>
                    </form>
                </div>
            ) : (
                /* Authenticated Task Manager View */
                <div>
                    {/* Task Creation Form */}
                    <div style={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '24px'
                    }}>
                        <form onSubmit={handleCreateTask}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px', marginBottom: '10px' }}>
                                <div>
                                    <input
                                        type="text"
                                        className="task-form-input"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Task title"
                                        required
                                    />
                                </div>
                                <div>
                                    <select
                                        className="task-form-select"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Description</label>
                                    <button
                                        type="button"
                                        disabled={aiLoading || !title.trim()}
                                        onClick={async () => {
                                            if (!title.trim()) return;
                                            setAiLoading(true);
                                            setAiError(null);
                                            try {
                                                const res = await generateAiDescription(title.trim());
                                                if (res && res.description) {
                                                    setDescription(res.description);
                                                    if (res.suggestedPriority) setPriority(res.suggestedPriority);
                                                    if (res.disclaimer) setAiDisclaimer(res.disclaimer);
                                                    setToast({ message: '✨ AI description generated! (You can edit it)', type: 'success' });
                                                }
                                            } catch (err) {
                                                setAiError(err.message || 'AI request failed');
                                                setToast({ message: err.message || 'AI request failed', type: 'error' });
                                            } finally {
                                                setAiLoading(false);
                                            }
                                        }}
                                        style={{
                                            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            cursor: aiLoading || !title.trim() ? 'not-allowed' : 'pointer',
                                            opacity: aiLoading || !title.trim() ? 0.6 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        <span>✨</span> {aiLoading ? 'AI Generating...' : 'Auto-Generate with AI'}
                                    </button>
                                </div>

                                <textarea
                                    className="task-form-textarea"
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        if (aiDisclaimer) setAiDisclaimer('');
                                    }}
                                    placeholder="Description (or click Auto-Generate with AI)"
                                    rows={3}
                                />

                                {aiLoading && (
                                    <div style={{ fontSize: '12px', color: '#a78bfa', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>⏳</span> Analyzing task title and generating structured description...
                                    </div>
                                )}

                                {aiDisclaimer && !aiLoading && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#fbbf24',
                                        background: '#78350f22',
                                        border: '1px solid #f59e0b44',
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        marginTop: '6px'
                                    }}>
                                        {aiDisclaimer}
                                    </div>
                                )}

                                {aiError && (
                                    <div style={{ fontSize: '11px', color: '#f87171', marginTop: '6px' }}>
                                        {aiError}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '8px 18px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Add Task
                            </button>
                        </form>
                    </div>

                    {/* Supplementary Problem 1: Lazy Loaded Chart */}
                    {showAnalytics && (
                        <Suspense fallback={
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#93c5fd',
                                background: '#1e293b',
                                borderRadius: '8px',
                                border: '1px solid #3b82f633',
                                marginBottom: '20px'
                            }}>
                                ⏳ Loading Analytics Chart chunk on demand...
                            </div>
                        }>
                            <TaskAnalyticsChart tasks={tasks} />
                        </Suspense>
                    )}

                    {/* Filter Tabs & Analytics Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                        borderBottom: '1px solid #27272a',
                        paddingBottom: '12px'
                    }}>
                        <button
                            type="button"
                            onClick={() => setShowAnalytics(prev => !prev)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: '1px solid #3b82f6',
                                backgroundColor: showAnalytics ? '#2563eb' : '#1e293b',
                                color: showAnalytics ? '#ffffff' : '#60a5fa',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginRight: '8px'
                            }}
                        >
                            <span>📊</span> {showAnalytics ? 'Hide Analytics' : 'Show Analytics (Lazy Loaded)'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: 'none',
                                backgroundColor: filter === 'all' ? '#27272a' : 'transparent',
                                color: filter === 'all' ? '#f4f4f5' : '#71717a',
                                cursor: 'pointer'
                            }}
                        >
                            All ({tasks.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('pending')}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: 'none',
                                backgroundColor: filter === 'pending' ? '#27272a' : 'transparent',
                                color: filter === 'pending' ? '#f4f4f5' : '#71717a',
                                cursor: 'pointer'
                            }}
                        >
                            Pending ({pendingCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('completed')}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: 'none',
                                backgroundColor: filter === 'completed' ? '#27272a' : 'transparent',
                                color: filter === 'completed' ? '#f4f4f5' : '#71717a',
                                cursor: 'pointer'
                            }}
                        >
                            Completed ({completedCount})
                        </button>
                    </div>

                    {/* Content Display */}
                    {loading && <Spinner />}
                    {error && <ErrorMessage message={error} onRetry={fetchTasks} />}

                    {!loading && !error && filteredTasks.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '36px 20px',
                            color: '#71717a',
                            fontSize: '13px'
                        }}>
                            No tasks found.
                        </div>
                    )}

                    {!loading && !error && filteredTasks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredTasks.map((task) => {
                                const isEditing = editingTask && editingTask._id === task._id;

                                if (isEditing) {
                                    return (
                                        <div key={task._id} style={{
                                            background: '#18181b',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '8px',
                                            padding: '16px'
                                        }}>
                                            <form onSubmit={handleSaveEdit}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '10px', marginBottom: '10px' }}>
                                                    <input
                                                        type="text"
                                                        className="task-form-input"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        required
                                                    />
                                                    <select
                                                        className="task-form-select"
                                                        value={editPriority}
                                                        onChange={(e) => setEditPriority(e.target.value)}
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                    </select>
                                                </div>
                                                <textarea
                                                    className="task-form-textarea"
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    rows={2}
                                                    style={{ marginBottom: '10px' }}
                                                />
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingTask(null)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #27272a',
                                                            background: '#27272a',
                                                            color: '#d4d4d8',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: '#2563eb',
                                                            color: '#fff',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={task._id}
                                        className="task-item-card"
                                        style={{
                                            backgroundColor: '#18181b',
                                            border: '1px solid #27272a',
                                            borderRadius: '8px',
                                            padding: '14px 16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            opacity: task.completed ? 0.6 : 1,
                                            transition: 'border-color 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleToggleComplete(task)}
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    marginTop: '3px',
                                                    cursor: 'pointer',
                                                    accentColor: '#3b82f6'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: '15px',
                                                        color: task.completed ? '#71717a' : '#f4f4f5',
                                                        textDecoration: task.completed ? 'line-through' : 'none',
                                                        fontWeight: '500'
                                                    }}>
                                                        {task.title}
                                                    </span>
                                                    {renderPriorityIndicator(task.priority)}
                                                </div>

                                                {task.description && (
                                                    <p style={{
                                                        margin: '4px 0 0 0',
                                                        color: '#a1a1aa',
                                                        fontSize: '13px',
                                                        textDecoration: task.completed ? 'line-through' : 'none',
                                                        lineHeight: '1.4'
                                                    }}>
                                                        {task.description}
                                                    </p>
                                                )}

                                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#52525b' }}>
                                                    {new Date(task.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(task)}
                                                title="Edit task"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#71717a',
                                                    padding: '6px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#f4f4f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setTaskToDelete(task)}
                                                title="Delete task"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#71717a',
                                                    padding: '6px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"/>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!taskToDelete}
                title="Delete Task"
                message={taskToDelete ? `Are you sure you want to delete "${taskToDelete.title}"?` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={() => setTaskToDelete(null)}
            />

            {/* Toast Notifications */}
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: '', type: 'success' })}
            />
        </section>
    );
}

export default Projects;
