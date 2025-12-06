import { Router } from 'express';
import { ExchangeModel } from '../models/Exchange.js';
import { ParticipantModel } from '../models/Participant.js';
import { AddParticipantRequest } from '../../../shared/types.js';
import { validateToken, validateParticipantName, validateExcludedNames, validateParticipantCode } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Add participant to exchange
router.post('/:token', validateToken, validateParticipantName, validateExcludedNames, (req, res) => {
  try {
    const { token } = req.params;
    const data: AddParticipantRequest = req.body;
    
    const exchange = ExchangeModel.findByOrganizerToken(token);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status === 'matched') {
      return res.status(400).json({ error: 'Cannot add participants after matching' });
    }

    // Check for duplicate names
    const existingNames = exchange.participants.map(p => p.name.toLowerCase());
    if (existingNames.includes(data.name.toLowerCase())) {
      return res.status(400).json({ error: 'Participant name already exists' });
    }

    const participant = ParticipantModel.create({
      exchangeId: exchange.id,
      name: data.name,
      excludedNames: data.excludedNames || []
    });

    // Update exchange status to ready if we have at least 2 participants
    if (exchange.participants.length + 1 >= 2) {
      ExchangeModel.updateStatus(exchange.id, 'ready');
    }

    res.status(201).json({
      id: participant.id,
      name: participant.name,
      excludedNames: participant.excludedNames
    });
  } catch (error) {
    logger.error({ err: error, token: req.params.token }, 'Error adding participant');
    const message = error instanceof Error ? error.message : 'Failed to add participant';
    res.status(500).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get participant's match by participant code
// Note: validateParticipantCode normalizes the code, so invalid codes return 400 before route handler
router.get('/match/:code/:name', validateParticipantCode, (req, res) => {
  try {
    const { code, name } = req.params;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Valid participant name is required' });
    }
    const exchange = ExchangeModel.findByParticipantCode(code);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status !== 'matched') {
      return res.status(400).json({ error: 'Exchange has not been matched yet' });
    }

    // Find participant by name (case-insensitive)
    const participant = exchange.participants.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found in this exchange' });
    }

    if (!participant.matchedWith) {
      return res.status(404).json({ error: 'No match found for this participant' });
    }

    // Find the matched participant
    const matchedParticipant = exchange.participants.find(
      p => p.id === participant.matchedWith
    );

    if (!matchedParticipant) {
      return res.status(404).json({ error: 'Matched participant not found' });
    }

    res.json({
      participantName: participant.name,
      matchedWithName: matchedParticipant.name
    });
  } catch (error) {
    logger.error({ err: error, code: req.params.code, name: req.params.name }, 'Error fetching match');
    const message = error instanceof Error ? error.message : 'Failed to fetch match';
    res.status(500).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete participant
router.delete('/:token/:participantId', validateToken, (req, res) => {
  try {
    const { token, participantId } = req.params;
    
    if (!participantId || typeof participantId !== 'string') {
      return res.status(400).json({ error: 'Participant ID is required' });
    }
    
    // Validate UUID format for participant ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(participantId)) {
      return res.status(400).json({ error: 'Invalid participant ID format' });
    }
    
    const exchange = ExchangeModel.findByOrganizerToken(token);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status === 'matched') {
      return res.status(400).json({ error: 'Cannot delete participants after matching' });
    }

    // Check if participant exists before deleting
    const participant = ParticipantModel.findById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    // Verify participant belongs to this exchange
    if (participant.exchangeId !== exchange.id) {
      return res.status(404).json({ error: 'Participant not found in this exchange' });
    }

    ParticipantModel.delete(participantId);

    // Update exchange status
    if (exchange.participants.length - 1 < 2) {
      ExchangeModel.updateStatus(exchange.id, 'draft');
    }

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error, token: req.params.token, participantId: req.params.participantId }, 'Error deleting participant');
    const message = error instanceof Error ? error.message : 'Failed to delete participant';
    res.status(500).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

