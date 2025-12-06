import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchingService } from './matchingService.js';
import { ParticipantModel } from '../models/Participant.js';
import type { Participant } from '../../../shared/types.js';

// Mock ParticipantModel to avoid database calls in unit tests
vi.mock('../models/Participant.js', () => ({
  ParticipantModel: {
    updateMatch: vi.fn(),
    updateMatchesInTransaction: vi.fn()
  }
}));

describe('MatchingService', () => {
  describe('generateMatches', () => {
    it('should return error for less than 2 participants', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 participants');
    });

    it('should successfully match 2 participants', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(true);
      expect(result.matches).toBeDefined();
      expect(result.matches?.length).toBe(2);
      
      // Verify each participant is matched
      const givers = result.matches?.map(m => m.giver) || [];
      const receivers = result.matches?.map(m => m.receiver) || [];
      expect(givers).toContain('1');
      expect(givers).toContain('2');
      expect(receivers).toContain('1');
      expect(receivers).toContain('2');
      
      // Verify no one is matched with themselves
      result.matches?.forEach(match => {
        expect(match.giver).not.toBe(match.receiver);
      });
    });

    it('should successfully match 3 participants', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          exchangeId: 'ex1',
          name: 'Charlie',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(true);
      expect(result.matches?.length).toBe(3);
      
      // Verify all participants are matched
      const allIds = participants.map(p => p.id);
      const givers = result.matches?.map(m => m.giver) || [];
      const receivers = result.matches?.map(m => m.receiver) || [];
      
      allIds.forEach(id => {
        expect(givers).toContain(id);
        expect(receivers).toContain(id);
      });
    });

    it('should respect exclusion rules', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: ['Bob'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          exchangeId: 'ex1',
          name: 'Charlie',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(true);
      
      // Alice should not be matched with Bob
      const aliceMatch = result.matches?.find(m => m.giver === '1');
      expect(aliceMatch?.receiver).not.toBe('2');
    });

    it('should handle multiple exclusion rules', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: ['Bob', 'Charlie'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob',
          excludedNames: ['Alice'],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          exchangeId: 'ex1',
          name: 'Charlie',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          exchangeId: 'ex1',
          name: 'Diana',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(true);
      
      // Alice should be matched with Diana (only option)
      const aliceMatch = result.matches?.find(m => m.giver === '1');
      expect(aliceMatch?.receiver).toBe('4');
    });

    it('should handle case-insensitive exclusion names', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: ['bob'], // lowercase
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob', // uppercase
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          exchangeId: 'ex1',
          name: 'Charlie',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(true);
      
      // Alice should not be matched with Bob despite case difference
      const aliceMatch = result.matches?.find(m => m.giver === '1');
      expect(aliceMatch?.receiver).not.toBe('2');
    });

    it('should handle large groups (10 participants)', () => {
      const participants: Participant[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        exchangeId: 'ex1',
        name: `Person${i + 1}`,
        excludedNames: [],
        createdAt: new Date().toISOString()
      }));

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(true);
      expect(result.matches?.length).toBe(10);
      
      // Verify all participants are matched
      const allIds = participants.map(p => p.id);
      const givers = result.matches?.map(m => m.giver) || [];
      const receivers = result.matches?.map(m => m.receiver) || [];
      
      allIds.forEach(id => {
        expect(givers).toContain(id);
        expect(receivers).toContain(id);
      });
    });

    it('should return error when matching is impossible due to constraints', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: ['Bob', 'Charlie'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob',
          excludedNames: ['Alice', 'Charlie'],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          exchangeId: 'ex1',
          name: 'Charlie',
          excludedNames: ['Alice', 'Bob'],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should ensure each participant gives to exactly one person', () => {
      const participants: Participant[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        exchangeId: 'ex1',
        name: `Person${i + 1}`,
        excludedNames: [],
        createdAt: new Date().toISOString()
      }));

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(true);
      
      const giverCounts = new Map<string, number>();
      result.matches?.forEach(match => {
        giverCounts.set(match.giver, (giverCounts.get(match.giver) || 0) + 1);
      });
      
      // Each participant should give exactly once
      participants.forEach(p => {
        expect(giverCounts.get(p.id)).toBe(1);
      });
    });

    it('should ensure each participant receives from exactly one person', () => {
      const participants: Participant[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        exchangeId: 'ex1',
        name: `Person${i + 1}`,
        excludedNames: [],
        createdAt: new Date().toISOString()
      }));

      const result = MatchingService.generateMatches(participants);
      expect(result.success).toBe(true);
      
      const receiverCounts = new Map<string, number>();
      result.matches?.forEach(match => {
        receiverCounts.set(match.receiver, (receiverCounts.get(match.receiver) || 0) + 1);
      });
      
      // Each participant should receive exactly once
      participants.forEach(p => {
        expect(receiverCounts.get(p.id)).toBe(1);
      });
    });
  });

  describe('validateMatchingPossible', () => {
    it('should return false for less than 2 participants', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.validateMatchingPossible(participants);
      expect(result.possible).toBe(false);
      expect(result.error).toContain('at least 2 participants');
    });

    it('should return false when participant has excluded everyone', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: ['Bob', 'Charlie'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          exchangeId: 'ex1',
          name: 'Charlie',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.validateMatchingPossible(participants);
      expect(result.possible).toBe(false);
      expect(result.error).toContain('Alice');
      expect(result.error).toContain('excluded all other participants');
    });

    it('should return true for valid participant set', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: ['Bob'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          exchangeId: 'ex1',
          name: 'Charlie',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.validateMatchingPossible(participants);
      expect(result.possible).toBe(true);
    });

    it('should handle case-insensitive exclusion names in validation', () => {
      const participants: Participant[] = [
        {
          id: '1',
          exchangeId: 'ex1',
          name: 'Alice',
          excludedNames: ['bob', 'CHARLIE'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          exchangeId: 'ex1',
          name: 'Bob',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          exchangeId: 'ex1',
          name: 'Charlie',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ];

      const result = MatchingService.validateMatchingPossible(participants);
      expect(result.possible).toBe(false);
      expect(result.error).toContain('Alice');
    });
  });
});

