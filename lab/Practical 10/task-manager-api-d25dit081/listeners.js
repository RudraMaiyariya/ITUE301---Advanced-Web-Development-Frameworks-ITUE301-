import taskEvents from './events.js';

/**
 * Event Listeners Registration - Practical 10
 */

// 1. Main Problem Listener: 'task-created'
// Processes notification in background without blocking the HTTP response
taskEvents.on('task-created', (taskData) => {
    const receivedTime = new Date().toISOString();
    console.log(`\n---------------------------------------------------------`);
    console.log(`[EVENT TRIGGERED] 'task-created' received at ${receivedTime}`);
    console.log(`[EVENT PAYLOAD] Task: "${taskData.title}" | User: ${taskData.user} | ID: ${taskData.taskId}`);

    // Supplementary Problem 3: Simulate heavy background task (e.g. email sending / push notification)
    // with a 2-second delay to prove that the API already responded instantly.
    console.log(`[BACKGROUND TASK] Dispatching notification email (simulating 2s delay)...`);
    
    setTimeout(() => {
        const completedTime = new Date().toISOString();
        console.log(`[BACKGROUND TASK FINISHED] Notification sent for "${taskData.title}" at ${completedTime}`);
        console.log(`---------------------------------------------------------\n`);
    }, 2000);
});

// 2. Supplementary Problem 1: 'task-deleted'
// Dedicated listener for task deletion events
taskEvents.on('task-deleted', (taskData) => {
    const timestamp = new Date().toISOString();
    console.log(`\n---------------------------------------------------------`);
    console.log(`[EVENT TRIGGERED] 'task-deleted' received at ${timestamp}`);
    console.log(`[EVENT AUDIT] Task Deleted: "${taskData.title}" (ID: ${taskData.taskId}) by User: ${taskData.user}`);
    console.log(`[BACKGROUND AUDIT] Deletion audit record archived at ${timestamp}`);
    console.log(`---------------------------------------------------------\n`);
});

// 3. Supplementary Problem 2: 'error'
// Catches and logs errors thrown inside event listeners without crashing the server
taskEvents.on('error', (err) => {
    const errorTime = new Date().toISOString();
    console.error(`\n[EVENT ERROR CAUGHT] Error handled by EventEmitter at ${errorTime}:`);
    console.error(`Message: ${err.message}`);
    console.error(`Stack: ${err.stack}\n`);
});

console.log('[TaskEvents] Listeners registered: [task-created, task-deleted, error]');

export default taskEvents;
