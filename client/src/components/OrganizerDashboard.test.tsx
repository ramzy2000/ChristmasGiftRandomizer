import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import OrganizerDashboard from './OrganizerDashboard';
import { api } from '../services/api';
import type { Exchange } from '../../../shared/types';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    getExchangeByOrganizerToken: vi.fn(),
    addParticipant: vi.fn(),
    deleteParticipant: vi.fn(),
    generateMatches: vi.fn(),
  }
}));

// Mock useParams
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

describe('OrganizerDashboard', () => {
  const mockExchange: Exchange = {
    id: 'test-id',
    name: 'Test Exchange',
    organizerToken: 'test-token',
    participantCode: 'TEST12',
    status: 'draft',
    participants: [],
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    mockUseParams.mockReturnValue({ token: 'test-token' });
  });

  it('should render loading state initially', () => {
    vi.mocked(api.getExchangeByOrganizerToken).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading exchange/i)).toBeInTheDocument();
  });

  it('should render exchange details', async () => {
    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(mockExchange);

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Exchange')).toBeInTheDocument();
      expect(screen.getByText(/Status:/i)).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  it('should display organizer token and participant code', async () => {
    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(mockExchange);

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('test-token')).toBeInTheDocument();
      expect(screen.getByText('TEST12')).toBeInTheDocument();
    });
  });

  it('should copy to clipboard when clicking on code', async () => {
    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(mockExchange);

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const tokenDisplay = screen.getByText('test-token');
      expect(tokenDisplay).toBeInTheDocument();
    });

    const tokenDisplay = screen.getByText('test-token');
    await userEvent.click(tokenDisplay);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test-token');
      expect(mockAlert).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  it('should add participant', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(mockExchange);
    vi.mocked(api.addParticipant).mockResolvedValue({
      id: 'participant-id',
      name: 'New Participant',
      excludedNames: []
    });

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter participant name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/Enter participant name/i);
    const submitButton = screen.getByRole('button', { name: /Add Participant/i });

    await user.type(nameInput, 'New Participant');
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.addParticipant).toHaveBeenCalledWith('test-token', {
        name: 'New Participant',
        excludedNames: []
      });
    });
  });

  it('should add participant with excluded names', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(mockExchange);
    vi.mocked(api.addParticipant).mockResolvedValue({
      id: 'participant-id',
      name: 'New Participant',
      excludedNames: ['Alice', 'Bob']
    });

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter participant name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/Enter participant name/i);
    const excludedInput = screen.getByPlaceholderText(/Comma-separated/i);
    const submitButton = screen.getByRole('button', { name: /Add Participant/i });

    await user.type(nameInput, 'New Participant');
    await user.type(excludedInput, 'Alice, Bob');
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.addParticipant).toHaveBeenCalledWith('test-token', {
        name: 'New Participant',
        excludedNames: ['Alice', 'Bob']
      });
    });
  });

  it('should display participants list', async () => {
    const exchangeWithParticipants: Exchange = {
      ...mockExchange,
      participants: [
        {
          id: 'p1',
          exchangeId: 'test-id',
          name: 'Alice',
          excludedNames: ['Bob'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'p2',
          exchangeId: 'test-id',
          name: 'Bob',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ]
    };

    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(exchangeWithParticipants);

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText(/Excludes: Bob/i)).toBeInTheDocument();
    });
  });

  it('should delete participant', async () => {
    const user = userEvent.setup();
    const exchangeWithParticipants: Exchange = {
      ...mockExchange,
      participants: [
        {
          id: 'p1',
          exchangeId: 'test-id',
          name: 'Alice',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ]
    };

    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(exchangeWithParticipants);
    vi.mocked(api.deleteParticipant).mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Remove/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(api.deleteParticipant).toHaveBeenCalledWith('test-token', 'p1');
    });
  });

  it('should generate matches', async () => {
    const user = userEvent.setup();
    const exchangeWithParticipants: Exchange = {
      ...mockExchange,
      status: 'ready',
      participants: [
        {
          id: 'p1',
          exchangeId: 'test-id',
          name: 'Alice',
          excludedNames: [],
          createdAt: new Date().toISOString()
        },
        {
          id: 'p2',
          exchangeId: 'test-id',
          name: 'Bob',
          excludedNames: [],
          createdAt: new Date().toISOString()
        }
      ]
    };

    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(exchangeWithParticipants);
    vi.mocked(api.generateMatches).mockResolvedValue({
      success: true,
      matches: [{ giver: 'p1', receiver: 'p2' }, { giver: 'p2', receiver: 'p1' }],
      exchange: { ...exchangeWithParticipants, status: 'matched' }
    });

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Matches/i })).toBeInTheDocument();
    });

    const generateButton = screen.getByRole('button', { name: /Generate Matches/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(api.generateMatches).toHaveBeenCalledWith('test-token');
    });
  });

  it('should not show generate button if already matched', async () => {
    const matchedExchange: Exchange = {
      ...mockExchange,
      status: 'matched',
      participants: [
        {
          id: 'p1',
          exchangeId: 'test-id',
          name: 'Alice',
          excludedNames: [],
          matchedWith: 'p2',
          createdAt: new Date().toISOString()
        },
        {
          id: 'p2',
          exchangeId: 'test-id',
          name: 'Bob',
          excludedNames: [],
          matchedWith: 'p1',
          createdAt: new Date().toISOString()
        }
      ]
    };

    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(matchedExchange);

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Generate Matches/i })).not.toBeInTheDocument();
      expect(screen.getByText(/Matches/i)).toBeInTheDocument();
    });
  });

  it('should display error message', async () => {
    vi.mocked(api.getExchangeByOrganizerToken).mockRejectedValue(new Error('Failed to load'));

    render(
      <BrowserRouter>
        <OrganizerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
  });
});

