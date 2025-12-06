import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { ExchangeModel } from '../models/Exchange.js';
import { ParticipantModel } from '../models/Participant.js';
import { MatchingService } from '../services/matchingService.js';

describe('Participant Routes', () => {
  let testExchangeId: string;
  let testOrganizerToken: string;
  let testParticipantCode: string;

  beforeEach(() => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    testExchangeId = exchange.id;
    testOrganizerToken = exchange.organizerToken;
    testParticipantCode = exchange.participantCode;
  });

  describe('POST /api/participants/:token', () => {
    it('should add a participant to an exchange', async () => {
      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({ name: 'New Participant' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Participant');
      expect(response.body.excludedNames).toEqual([]);
    });

    it('should add participant with excluded names', async () => {
      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({
          name: 'New Participant',
          excludedNames: ['Alice', 'Bob']
        })
        .expect(201);

      expect(response.body.excludedNames).toEqual(['Alice', 'Bob']);
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid name (too short)', async () => {
      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({ name: 'A' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for duplicate participant name', async () => {
      // Add first participant
      await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({ name: 'Alice' })
        .expect(201);

      // Try to add duplicate
      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({ name: 'Alice' })
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });

    it('should handle case-insensitive duplicate check', async () => {
      await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({ name: 'Alice' })
        .expect(201);

      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({ name: 'alice' })
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 when trying to add participant to matched exchange', async () => {
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

      await request(app)
        .post(`/api/exchanges/${testOrganizerToken}/match`)
        .expect(200);

      // Try to add participant after matching
      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({ name: 'Charlie' })
        .expect(400);

      expect(response.body.error).toContain('after matching');
    });

    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .post('/api/participants/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should trim whitespace from participant name', async () => {
      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({ name: '  Test Participant  ' })
        .expect(201);

      expect(response.body.name).toBe('Test Participant');
    });

    it('should trim and filter excluded names', async () => {
      const response = await request(app)
        .post(`/api/participants/${testOrganizerToken}`)
        .send({
          name: 'Test Participant',
          excludedNames: ['  Alice  ', '  Bob  ', '', '  ']
        })
        .expect(201);

      expect(response.body.excludedNames).toEqual(['Alice', 'Bob']);
    });
  });

  describe('GET /api/participants/match/:code/:name', () => {
    it('should return participant match', async () => {
      // Add participants and match
      const alice = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: []
      });
      const bob = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Bob',
        excludedNames: []
      });

      // Generate matches
      const result = MatchingService.generateMatches([
        alice,
        bob
      ]);
      expect(result.success).toBe(true);

      ExchangeModel.updateStatus(testExchangeId, 'matched');

      const response = await request(app)
        .get(`/api/participants/match/${testParticipantCode}/Alice`)
        .expect(200);

      expect(response.body).toHaveProperty('participantName');
      expect(response.body).toHaveProperty('matchedWithName');
      expect(response.body.participantName).toBe('Alice');
    });

    it('should handle case-insensitive name matching', async () => {
      const alice = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: []
      });
      const bob = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Bob',
        excludedNames: []
      });

      MatchingService.generateMatches([alice, bob]);
      ExchangeModel.updateStatus(testExchangeId, 'matched');

      const response = await request(app)
        .get(`/api/participants/match/${testParticipantCode}/alice`)
        .expect(200);

      expect(response.body.participantName).toBe('Alice');
    });

    it('should return 400 if exchange not matched yet', async () => {
      ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: []
      });

      const response = await request(app)
        .get(`/api/participants/match/${testParticipantCode}/Alice`)
        .expect(400);

      expect(response.body.error).toContain('not been matched');
    });

    it('should return 404 for non-existent participant', async () => {
      const alice = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: []
      });
      const bob = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Bob',
        excludedNames: []
      });

      MatchingService.generateMatches([alice, bob]);
      ExchangeModel.updateStatus(testExchangeId, 'matched');

      const response = await request(app)
        .get(`/api/participants/match/${testParticipantCode}/NonExistent`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for non-existent exchange code', async () => {
      // Use a valid format code that doesn't exist (6 uppercase alphanumeric)
      const response = await request(app)
        .get('/api/participants/match/ZZZZZZ/Alice')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid participant code format', async () => {
      const response = await request(app)
        .get('/api/participants/match/invalid/Alice')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid name', async () => {
      const response = await request(app)
        .get(`/api/participants/match/${testParticipantCode}/A`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/participants/:token/:participantId', () => {
    it('should delete a participant', async () => {
      const participant = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Test Participant',
        excludedNames: []
      });

      const response = await request(app)
        .delete(`/api/participants/${testOrganizerToken}/${participant.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify participant is deleted
      const found = ParticipantModel.findById(participant.id);
      expect(found).toBeNull();
    });

    it('should return 400 when trying to delete from matched exchange', async () => {
      const participant = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Alice',
        excludedNames: []
      });
      const participant2 = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Bob',
        excludedNames: []
      });

      await request(app)
        .post(`/api/exchanges/${testOrganizerToken}/match`)
        .expect(200);

      const response = await request(app)
        .delete(`/api/participants/${testOrganizerToken}/${participant.id}`)
        .expect(400);

      expect(response.body.error).toContain('after matching');
    });

    it('should return 404 for non-existent participant', async () => {
      const response = await request(app)
        .delete(`/api/participants/${testOrganizerToken}/00000000-0000-0000-0000-000000000000`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent token', async () => {
      const participant = ParticipantModel.create({
        exchangeId: testExchangeId,
        name: 'Test Participant',
        excludedNames: []
      });

      const response = await request(app)
        .delete(`/api/participants/00000000-0000-0000-0000-000000000000/${participant.id}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid participant ID', async () => {
      const response = await request(app)
        .delete(`/api/participants/${testOrganizerToken}/invalid-id`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

