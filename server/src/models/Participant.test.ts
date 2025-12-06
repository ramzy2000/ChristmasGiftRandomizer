import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ParticipantModel } from './Participant.js';
import { ExchangeModel } from './Exchange.js';
import { createTestDb, closeTestDb } from '../test/testDb.js';
import type DatabaseType from 'better-sqlite3';

let testDb: DatabaseType.Database;

describe('ParticipantModel', () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    if (testDb) {
      closeTestDb(testDb);
    }
  });

  it('should create a participant with valid data', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const participant = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Test Participant',
      excludedNames: []
    });
    
    expect(participant).toBeDefined();
    expect(participant.id).toBeDefined();
    expect(participant.exchangeId).toBe(exchange.id);
    expect(participant.name).toBe('Test Participant');
    expect(participant.excludedNames).toEqual([]);
    expect(participant.createdAt).toBeDefined();
  });

  it('should create a participant with excluded names', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const participant = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Test Participant',
      excludedNames: ['Alice', 'Bob']
    });
    
    expect(participant.excludedNames).toEqual(['Alice', 'Bob']);
  });

  it('should find participant by ID', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const created = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Test Participant',
      excludedNames: []
    });
    
    const found = ParticipantModel.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe('Test Participant');
  });

  it('should return null for non-existent participant ID', () => {
    const found = ParticipantModel.findById('non-existent-id');
    expect(found).toBeNull();
  });

  it('should find participants by exchange ID', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const participant1 = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Participant 1',
      excludedNames: []
    });
    const participant2 = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Participant 2',
      excludedNames: []
    });
    
    const participants = ParticipantModel.findByExchangeId(exchange.id);
    expect(participants.length).toBe(2);
    expect(participants.map(p => p.id)).toContain(participant1.id);
    expect(participants.map(p => p.id)).toContain(participant2.id);
  });

  it('should return empty array for exchange with no participants', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const participants = ParticipantModel.findByExchangeId(exchange.id);
    expect(participants).toEqual([]);
  });

  it('should update participant match', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const giver = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Giver',
      excludedNames: []
    });
    const receiver = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Receiver',
      excludedNames: []
    });
    
    ParticipantModel.updateMatch(giver.id, receiver.id);
    
    const updated = ParticipantModel.findById(giver.id);
    expect(updated?.matchedWith).toBe(receiver.id);
  });

  it('should update multiple matches in transaction', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const p1 = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'P1',
      excludedNames: []
    });
    const p2 = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'P2',
      excludedNames: []
    });
    const p3 = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'P3',
      excludedNames: []
    });
    const p4 = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'P4',
      excludedNames: []
    });
    
    const matches = [
      { giver: p1.id, receiver: p2.id },
      { giver: p3.id, receiver: p4.id }
    ];
    
    ParticipantModel.updateMatchesInTransaction(matches);
    
    const updated1 = ParticipantModel.findById(p1.id);
    const updated3 = ParticipantModel.findById(p3.id);
    
    expect(updated1?.matchedWith).toBe(p2.id);
    expect(updated3?.matchedWith).toBe(p4.id);
  });

  it('should delete a participant', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const participant = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Test Participant',
      excludedNames: []
    });
    
    ParticipantModel.delete(participant.id);
    
    const found = ParticipantModel.findById(participant.id);
    expect(found).toBeNull();
  });

  it('should preserve excluded names as JSON array', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const participant = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Test Participant',
      excludedNames: ['Alice', 'Bob', 'Charlie']
    });
    
    const found = ParticipantModel.findById(participant.id);
    expect(found?.excludedNames).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('should handle empty excluded names array', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const participant = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Test Participant',
      excludedNames: []
    });
    
    const found = ParticipantModel.findById(participant.id);
    expect(found?.excludedNames).toEqual([]);
  });

  it('should handle undefined excluded names', () => {
    const exchange = ExchangeModel.create({ name: 'Test Exchange' });
    const participant = ParticipantModel.create({
      exchangeId: exchange.id,
      name: 'Test Participant'
    });
    
    const found = ParticipantModel.findById(participant.id);
    expect(found?.excludedNames).toEqual([]);
  });
});

