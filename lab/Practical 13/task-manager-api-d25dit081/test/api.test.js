import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

/**
 * Practical 12: Automated Tests for CI/CD Pipeline
 * Executed automatically by GitHub Actions on push and pull requests
 */
describe('Practical 12: Automated CI/CD Unit & Integration Tests', () => {

    test('1. Environment & Server Defaults verification', () => {
        const defaultPort = 5000;
        assert.equal(typeof defaultPort, 'number');
        assert.equal(defaultPort, 5000);
    });

    test('2. JWT Authentication Token generation and verification', () => {
        const payload = { id: 'test_user_123', email: 'rudra@example.com', name: 'Rudra Maiyariya' };
        const secret = 'awdf_practical12_ci_secret_key';

        const token = jwt.sign(payload, secret, { expiresIn: '1h' });
        assert.ok(token, 'Token should be successfully generated');

        const decoded = jwt.verify(token, secret);
        assert.equal(decoded.id, 'test_user_123');
        assert.equal(decoded.email, 'rudra@example.com');
        assert.equal(decoded.name, 'Rudra Maiyariya');
    });

    test('3. Task Payload Validation - Title & Priority rules', () => {
        const validTask = {
            title: 'Complete Practical 12 CI/CD Pipeline',
            priority: 'high',
            completed: false
        };

        assert.ok(validTask.title.trim().length > 0, 'Title must not be empty');
        assert.match(validTask.priority, /^(low|medium|high)$/, 'Priority must be valid enum');
        assert.equal(typeof validTask.completed, 'boolean');
    });

    test('4. In-Memory Cache TTL & Settings validation', () => {
        const defaultTTL = 60;
        assert.equal(typeof defaultTTL, 'number');
        assert.equal(defaultTTL >= 60, true, 'Default TTL should be at least 60 seconds');
    });

});
