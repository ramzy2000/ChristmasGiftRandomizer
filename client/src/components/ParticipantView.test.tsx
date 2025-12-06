import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ParticipantView from './ParticipantView';
import { api } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    getExchangeByParticipantCode: vi.fn(),
    getParticipantMatch: vi.fn(),
  }
}));

// Mock useParams and useSearchParams
const mockUseParams = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
  };
});

describe('ParticipantView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ code: 'TEST12' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  it('should render loading state initially', () => {
    vi.mocked(api.getExchangeByParticipantCode).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should render exchange name', async () => {
    vi.mocked(api.getExchangeByParticipantCode).mockResolvedValue({
      id: 'test-id',
      name: 'Test Exchange',
      status: 'matched'
    });

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Exchange')).toBeInTheDocument();
    });
  });

  it('should show message when exchange is not matched yet', async () => {
    vi.mocked(api.getExchangeByParticipantCode).mockResolvedValue({
      id: 'test-id',
      name: 'Test Exchange',
      status: 'draft'
    });

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/not been matched yet/i)).toBeInTheDocument();
    });
  });

  it('should show form to enter name when exchange is matched', async () => {
    vi.mocked(api.getExchangeByParticipantCode).mockResolvedValue({
      id: 'test-id',
      name: 'Test Exchange',
      status: 'matched'
    });
    // Ensure no name in URL so it doesn't auto-load
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Match/i })).toBeInTheDocument();
    });
  });

  it('should load match when name is provided in URL', async () => {
    vi.mocked(api.getExchangeByParticipantCode).mockResolvedValue({
      id: 'test-id',
      name: 'Test Exchange',
      status: 'matched'
    });

    vi.mocked(api.getParticipantMatch).mockResolvedValue({
      participantName: 'Alice',
      matchedWithName: 'Bob'
    });

    // Mock useSearchParams to return name
    const mockSearchParams = new URLSearchParams('?name=Alice');
    mockUseSearchParams.mockReturnValue([mockSearchParams]);

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.getParticipantMatch).toHaveBeenCalledWith('TEST12', 'Alice');
    });
  });

  it('should display match result', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getExchangeByParticipantCode).mockResolvedValue({
      id: 'test-id',
      name: 'Test Exchange',
      status: 'matched'
    });

    vi.mocked(api.getParticipantMatch).mockResolvedValue({
      participantName: 'Alice',
      matchedWithName: 'Bob'
    });
    // Ensure no name in URL initially
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Your Name/i);
    const submitButton = screen.getByRole('button', { name: /View Match/i });

    await user.type(nameInput, 'Alice');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Your Match/i)).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText(/You are giving a gift to:/i)).toBeInTheDocument();
    });
  });

  it('should show error message on match fetch failure', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getExchangeByParticipantCode).mockResolvedValue({
      id: 'test-id',
      name: 'Test Exchange',
      status: 'matched'
    });

    vi.mocked(api.getParticipantMatch).mockRejectedValue(new Error('Participant not found'));
    // Ensure no name in URL initially
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Your Name/i);
    const submitButton = screen.getByRole('button', { name: /View Match/i });

    await user.type(nameInput, 'Alice');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Participant not found/i)).toBeInTheDocument();
    });
  });

  it('should show error when exchange is not found', async () => {
    vi.mocked(api.getExchangeByParticipantCode).mockRejectedValue(new Error('Exchange not found'));

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Exchange not found/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Go Home/i })).toBeInTheDocument();
    });
  });

  it('should disable submit button when name is empty', async () => {
    vi.mocked(api.getExchangeByParticipantCode).mockResolvedValue({
      id: 'test-id',
      name: 'Test Exchange',
      status: 'matched'
    });
    // Ensure no name in URL initially
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);

    render(
      <BrowserRouter>
        <ParticipantView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
      const submitButton = screen.getByRole('button', { name: /View Match/i });
      expect(submitButton).toBeDisabled();
    });
  });
});

