import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../services/api';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

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
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form inputs
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [submitting, setSubmitting] = useState(false);

    // Filter: 'all' | 'pending' | 'completed'
    const [filter, setFilter] = useState('all');

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
        setLoading(true);
        setError(null);
        try {
            const data = await getTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Error fetching tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

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

        // 1. Show new task in UI immediately before server confirms
        setTasks(prev => [optimisticTask, ...prev]);
        setTitle('');
        setDescription('');
        setPriority('medium');

        try {
            // 2. Persist to MongoDB via backend
            const created = await createTask(taskPayload);
            // 3. Replace temp task with confirmed document from server
            setTasks(prev => prev.map(t => t._id === tempId ? created : t));
            showToast('Task created');
        } catch (err) {
            // 4. Rollback UI if API request fails
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', color: '#f4f4f5', margin: 0, fontWeight: '600', letterSpacing: '-0.3px' }}>
                    Tasks
                </h2>
                <button
                    type="button"
                    onClick={fetchTasks}
                    title="Refresh tasks"
                    style={{
                        padding: '6px 12px',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        background: '#18181b',
                        color: '#a1a1aa',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    Refresh
                </button>
            </div>

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
                        <textarea
                            className="task-form-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 18px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.7 : 1
                        }}
                    >
                        {submitting ? 'Adding...' : 'Add Task'}
                    </button>
                </form>
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '1px solid #27272a',
                paddingBottom: '12px'
            }}>
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
