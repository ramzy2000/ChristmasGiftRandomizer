import { MatchResult, Participant } from '../../../shared/types.js';
import { ParticipantModel } from '../models/Participant.js';

/**
 * Graph-based matching algorithm using constraint satisfaction
 * This implements a backtracking algorithm to find a valid perfect matching
 * where each participant is matched with exactly one other participant,
 * respecting exclusion constraints.
 */
export class MatchingService {
  /**
   * Generate matches for all participants in an exchange
   * Uses a backtracking algorithm to find a valid solution
   */
  static generateMatches(participants: Participant[]): MatchResult {
    if (participants.length < 2) {
      return {
        success: false,
        error: 'Need at least 2 participants to create matches'
      };
    }

    // Build exclusion map for quick lookup
    const exclusionMap = new Map<string, Set<string>>();
    const nameToId = new Map<string, string>();
    
    participants.forEach(p => {
      exclusionMap.set(p.id, new Set(p.excludedNames));
      nameToId.set(p.name.toLowerCase(), p.id);
    });

    // Convert name-based exclusions to ID-based exclusions
    exclusionMap.forEach((excludedNames, participantId) => {
      const participant = participants.find(p => p.id === participantId)!;
      excludedNames.forEach(excludedName => {
        const excludedId = nameToId.get(excludedName.toLowerCase());
        if (excludedId) {
          exclusionMap.get(participantId)!.add(excludedId);
        }
      });
    });

    // Add self-exclusion (can't match with yourself)
    participants.forEach(p => {
      exclusionMap.get(p.id)!.add(p.id);
    });

    // Try to find a valid matching
    const matches: Array<{ giver: string; receiver: string }> = [];
    const usedGivers = new Set<string>();
    const usedReceivers = new Set<string>();
    // Use object to share counter across recursive calls
    const attemptCounter = { count: 0 };
    const maxAttempts = 10000; // Increased for larger groups

    // Shuffle participants for randomness
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    const result = this.findMatching(
      shuffled,
      exclusionMap,
      matches,
      usedGivers,
      usedReceivers,
      maxAttempts,
      attemptCounter
    );

    if (result.success && result.matches) {
      // Apply matches to database in a transaction to ensure atomicity
      ParticipantModel.updateMatchesInTransaction(result.matches);

      return result;
    }

    return {
      success: false,
      error: 'Unable to find a valid matching with the given constraints. Try removing some exclusion rules.'
    };
  }

  /**
   * Recursive backtracking algorithm to find valid matching
   * Creates a complete matching where:
   * - Each participant gives to exactly one other participant
   * - Each participant receives from exactly one other participant
   */
  private static findMatching(
    participants: Participant[],
    exclusionMap: Map<string, Set<string>>,
    matches: Array<{ giver: string; receiver: string }>,
    usedGivers: Set<string>,
    usedReceivers: Set<string>,
    maxAttempts: number,
    attemptCounter: { count: number }
  ): MatchResult {
    // Increment attempt counter and check limit
    attemptCounter.count++;
    if (attemptCounter.count >= maxAttempts) {
      return { success: false, error: 'Maximum attempts reached' };
    }

    // Base case: all participants are givers (each gives to someone)
    // Since we also track receivers, this ensures everyone receives exactly once too
    if (usedGivers.size === participants.length) {
      return { success: true, matches: [...matches] };
    }

    // Find first unmatched giver
    const giver = participants.find(p => !usedGivers.has(p.id));
    if (!giver) {
      return { success: true, matches: [...matches] };
    }

    // Get valid receivers for this giver
    // A receiver is valid if:
    // 1. They're not the giver themselves
    // 2. They're not already receiving from someone else
    // 3. They're not excluded by the giver
    const validReceivers = participants.filter(receiver => {
      if (receiver.id === giver.id) return false;
      if (usedReceivers.has(receiver.id)) return false; // Already receiving from someone
      
      const exclusions = exclusionMap.get(giver.id);
      if (exclusions && exclusions.has(receiver.id)) return false;
      
      return true;
    });

    // If no valid receivers, backtrack immediately
    if (validReceivers.length === 0) {
      return { success: false, error: 'No valid matching found' };
    }

    // Shuffle for randomness
    validReceivers.sort(() => Math.random() - 0.5);

    // Try each valid receiver
    for (const receiver of validReceivers) {
      matches.push({ giver: giver.id, receiver: receiver.id });
      usedGivers.add(giver.id);
      usedReceivers.add(receiver.id);

      const result = this.findMatching(
        participants,
        exclusionMap,
        matches,
        usedGivers,
        usedReceivers,
        maxAttempts,
        attemptCounter
      );

      if (result.success) {
        return result;
      }

      // Backtrack
      matches.pop();
      usedGivers.delete(giver.id);
      usedReceivers.delete(receiver.id);
    }

    return { success: false, error: 'No valid matching found' };
  }

  /**
   * Validate if a matching is possible with given constraints
   */
  static validateMatchingPossible(participants: Participant[]): { possible: boolean; error?: string } {
    if (participants.length < 2) {
      return { possible: false, error: 'Need at least 2 participants' };
    }

    // Check if any participant has too many exclusions
    const exclusionMap = new Map<string, Set<string>>();
    const nameToId = new Map<string, string>();

    participants.forEach(p => {
      exclusionMap.set(p.id, new Set(p.excludedNames));
      nameToId.set(p.name.toLowerCase(), p.id);
    });

    // Convert name-based exclusions to ID-based
    exclusionMap.forEach((excludedNames, participantId) => {
      const participant = participants.find(p => p.id === participantId)!;
      const idExclusions = new Set<string>();
      
      excludedNames.forEach(excludedName => {
        const excludedId = nameToId.get(excludedName.toLowerCase());
        if (excludedId) {
          idExclusions.add(excludedId);
        }
      });
      
      // Add self-exclusion
      idExclusions.add(participantId);
      
      // Replace the set with ID-based exclusions only
      exclusionMap.set(participantId, idExclusions);
    });

    // Check if any participant has excluded everyone
    for (const participant of participants) {
      const exclusions = exclusionMap.get(participant.id)!;
      if (exclusions.size >= participants.length) {
        return {
          possible: false,
          error: `${participant.name} has excluded all other participants`
        };
      }
    }

    return { possible: true };
  }
}

