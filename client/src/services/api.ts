import type {
  Exchange,
  CreateExchangeRequest,
  AddParticipantRequest,
  ParticipantMatch
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Exchange endpoints
  async createExchange(data: CreateExchangeRequest): Promise<{
    id: string;
    name: string;
    organizerToken: string;
    participantCode: string;
    status: string;
    createdAt: string;
  }> {
    return this.request('/exchanges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getExchangeByOrganizerToken(token: string): Promise<Exchange> {
    return this.request(`/exchanges/organizer/${token}`);
  }

  async getExchangeByParticipantCode(code: string): Promise<{
    id: string;
    name: string;
    status: string;
  }> {
    return this.request(`/exchanges/participant/${code}`);
  }

  async generateMatches(token: string): Promise<{
    success: boolean;
    matches?: Array<{ giver: string; receiver: string }>;
    exchange?: any;
    error?: string;
  }> {
    return this.request(`/exchanges/${token}/match`, {
      method: 'POST',
    });
  }

  // Participant endpoints
  async addParticipant(
    token: string,
    data: AddParticipantRequest
  ): Promise<{
    id: string;
    name: string;
    excludedNames: string[];
  }> {
    return this.request(`/participants/${token}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getParticipantMatch(code: string, name: string): Promise<ParticipantMatch> {
    return this.request(`/participants/match/${code}/${encodeURIComponent(name)}`);
  }

  async deleteParticipant(token: string, participantId: string): Promise<{ success: boolean }> {
    return this.request(`/participants/${token}/${participantId}`, {
      method: 'DELETE',
    });
  }

  // Notification endpoints
  async subscribeToNotifications(
    participantId: string,
    subscription: PushSubscription
  ): Promise<{ success: boolean }> {
    return this.request('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ participantId, subscription }),
    });
  }
}

export const api = new ApiClient();

