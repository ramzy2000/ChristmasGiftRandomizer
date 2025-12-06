export interface Participant {
  id: string;
  exchangeId: string;
  name: string;
  excludedNames: string[]; // Names this participant cannot be matched with
  matchedWith?: string; // ID of the participant they're matched with
  createdAt: string;
}

export interface Exchange {
  id: string;
  name: string;
  organizerToken: string; // Secret token for organizer to manage exchange
  participantCode: string; // Public code for participants to view their match
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

