import { Router } from 'express';
import { ExchangeModel } from '../models/Exchange.js';
import { ParticipantModel } from '../models/Participant.js';
import { AddParticipantRequest } from '../types.js';
import { validateToken, validateParticipantName, validateExcludedNames, validateParticipantCode } from '../middleware/validation.js';

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
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// Get participant's match by participant code
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
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Delete participant
router.delete('/:token/:participantId', validateToken, (req, res) => {
  try {
    const { token, participantId } = req.params;
    
    if (!participantId || typeof participantId !== 'string') {
      return res.status(400).json({ error: 'Participant ID is required' });
    }
    const exchange = ExchangeModel.findByOrganizerToken(token);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status === 'matched') {
      return res.status(400).json({ error: 'Cannot delete participants after matching' });
    }

    ParticipantModel.delete(participantId);

    // Update exchange status
    if (exchange.participants.length - 1 < 2) {
      ExchangeModel.updateStatus(exchange.id, 'draft');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting participant:', error);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

export default router;

