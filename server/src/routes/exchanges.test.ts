import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { ExchangeModel } from '../models/Exchange.js';
import { ParticipantModel } from '../models/Participant.js';

describe('Exchange Routes', () => {
  let testExchangeId: string;
  let testOrganizerToken: string;
  let testParticipantCode: string;

  beforeEach(() => {
    // Create a test exchange for tests that need it
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    testExchangeId = exchange.id;
    testOrganizerToken = exchange.organizerToken;
    testParticipantCode = exchange.participantCode;
  });

  afterEach(() => {
    // Clean up is handled by the database, but we could add explicit cleanup if needed
  });

  describe('POST /api/exchanges', () => {
    it('should create a new exchange', async () => {
      const response = await request(app)
        .post('/api/exchanges')
        .send({ name: 'New Exchange' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('organizerToken');
      expect(response.body).toHaveProperty('participantCode');
      expect(response.body.name).toBe('New Exchange');
      expect(response.body.status).toBe('draft');
      expect(response.body.organizerToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(response.body.participantCode).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/exchanges')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid name (too short)', async () => {
      const response = await request(app)
        .post('/api/exchanges')
        .send({ name: 'AB' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid name (too long)', async () => {
      const response = await request(app)
        .post('/api/exchanges')
        .send({ name: 'A'.repeat(101) })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should trim whitespace from exchange name', async () => {
      const response = await request(app)
        .post('/api/exchanges')
        .send({ name: '  Test Exchange  ' })
        .expect(201);

      expect(response.body.name).toBe('Test Exchange');
    });
  });

  describe('GET /api/exchanges/organizer/:token', () => {
    it('should return exchange by organizer token', async () => {
      const response = await request(app)
        .get(`/api/exchanges/organizer/${testOrganizerToken}`)
        .expect(200);

      expect(response.body.id).toBe(testExchangeId);
      expect(response.body.name).toBe('Test Exchange');
      expect(response.body.organizerToken).toBe(testOrganizerToken);
      expect(response.body.participantCode).toBe(testParticipantCode);
      expect(response.body).toHaveProperty('participants');
      expect(Array.isArray(response.body.participants)).toBe(true);
    });

    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .get('/api/exchanges/organizer/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid token format', async () => {
      const response = await request(app)
        .get('/api/exchanges/organizer/invalid-token')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should include participants in response', async () => {
      // Add a participant
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Test Participant',
        excludedNames: []
      });

      const response = await request(app)
        .get(`/api/exchanges/organizer/${testOrganizerToken}`)
        .expect(200);

      expect(response.body.participants.length).toBe(1);
      expect(response.body.participants[0].name).toBe('Test Participant');
    });
  });

  describe('GET /api/exchanges/participant/:code', () => {
    it('should return exchange by participant code', async () => {
      const response = await request(app)
        .get(`/api/exchanges/participant/${testParticipantCode}`)
        .expect(200);

      expect(response.body.id).toBe(testExchangeId);
      expect(response.body.name).toBe('Test Exchange');
      expect(response.body.status).toBe('draft');
      // Should not include sensitive info
      expect(response.body).not.toHaveProperty('organizerToken');
      expect(response.body).not.toHaveProperty('participants');
    });

    it('should return 404 for non-existent code', async () => {
      // Use a valid format code that doesn't exist
      const response = await request(app)
        .get('/api/exchanges/participant/ZZZZZZ')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid code format', async () => {
      const response = await request(app)
        .get('/api/exchanges/participant/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/exchanges/:token/match', () => {
    it('should generate matches for exchange with 2+ participants', async () => {
      // Add participants
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: []
      });
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Bob',
        excludedNames: []
      });

      const response = await request(app)
        .post(`/api/exchanges/${testOrganizerToken}/match`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.matches).toBeDefined();
      expect(Array.isArray(response.body.matches)).toBe(true);
      expect(response.body.matches.length).toBe(2);
      expect(response.body.exchange.status).toBe('matched');
      expect(response.body.exchange.matchedAt).toBeDefined();
    });

    it('should return 400 if exchange already matched', async () => {
      // Add participants and match
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: []
      });
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Bob',
        excludedNames: []
      });

      // First match
      await request(app)
        .post(`/api/exchanges/${testOrganizerToken}/match`)
        .expect(200);

      // Second match should fail
      const response = await request(app)
        .post(`/api/exchanges/${testOrganizerToken}/match`)
        .expect(400);

      expect(response.body.error).toContain('already matched');
    });

    it('should return 400 for exchange with less than 2 participants', async () => {
      const response = await request(app)
        .post(`/api/exchanges/${testOrganizerToken}/match`)
        .expect(400);

      expect(response.body.error).toContain('at least 2 participants');
    });

    it('should return 400 for impossible matching constraints', async () => {
      // Create participants where matching is impossible
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: ['Bob']
      });
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Bob',
        excludedNames: ['Alice']
      });

      const response = await request(app)
        .post(`/api/exchanges/${testOrganizerToken}/match`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .post('/api/exchanges/00000000-0000-0000-0000-000000000000/match')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid token format', async () => {
      const response = await request(app)
        .post('/api/exchanges/invalid-token/match')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should respect exclusion rules when matching', async () => {
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: ['Bob']
      });
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Bob',
        excludedNames: []
      });
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Charlie',
        excludedNames: []
      });

      const response = await request(app)
        .post(`/api/exchanges/${testOrganizerToken}/match`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verify Alice is not matched with Bob
      const aliceMatch = response.body.matches.find((m: any) => {
        const exchange = ExchangeModel.findById(testExchangeId);
        const alice = exchange?.participants.find(p => p.name === 'Alice');
        return alice && m.giver === alice.id;
      });
      
      if (aliceMatch) {
        const exchange = ExchangeModel.findById(testExchangeId);
        const bob = exchange?.participants.find(p => p.name === 'Bob');
        expect(aliceMatch.receiver).not.toBe(bob?.id);
      }
    });
  });
});

