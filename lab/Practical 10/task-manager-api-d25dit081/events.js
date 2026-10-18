import { EventEmitter } from 'events';

/**
 * TaskEvents - Practical 10
 * Centralized EventEmitter instance for asynchronous background event processing.
 * Decouples background tasks (notifications, logging, metrics) from the main request-response cycle.
 */
class TaskEvents extends EventEmitter {}

// Instantiate singleton task event bus
const taskEvents = new TaskEvents();

// Set max listeners to avoid memory leak warnings during scaling
taskEvents.setMaxListeners(20);

export default taskEvents;
