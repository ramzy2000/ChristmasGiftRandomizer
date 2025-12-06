import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Notification Routes', () => {
  describe('POST /api/notifications/subscribe', () => {
    it('should accept subscription request', async () => {
      const mockSubscription = {
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'test-key',
          auth: 'test-auth'
        }
      };

      const response = await request(app)
        .post('/api/notifications/subscribe')
        .send({
          participantId: 'test-participant-id',
          subscription: mockSubscription
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing participantId', async () => {
      const response = await request(app)
        .post('/api/notifications/subscribe')
        .send({
          subscription: {}
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing subscription', async () => {
      const response = await request(app)
        .post('/api/notifications/subscribe')
        .send({
          participantId: 'test-id'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

