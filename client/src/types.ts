// Client-side types (duplicated from shared for now)
// In a monorepo setup, you could import from shared directly

export interface Participant {
  id: string;
  exchangeId: string;
  name: string;
  excludedNames: string[];
  matchedWith?: string;
  createdAt: string;
}

export interface Exchange {
  id: string;
  name: string;
  organizerToken: string;
  participantCode: string;
  status: 'draft' | 'ready' | 'matched' | 'completed';
  participants: Participant[];
  createdAt: string;
  matchedAt?: string;
}

export interface CreateExchangeRequest {
  name: string;
}

export interface AddParticipantRequest {
  name: string;
  excludedNames?: string[];
}

export interface MatchResult {
  success: boolean;
  matches?: Array<{ giver: string; receiver: string }>;
  error?: string;
}

export interface ParticipantMatch {
  participantName: string;
  matchedWithName: string;
}

