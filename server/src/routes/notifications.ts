import { Router } from 'express';
import { NotificationService } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Subscribe to push notifications
router.post('/subscribe', (req, res) => {
  try {
    const { participantId, subscription } = req.body;
    
    if (!participantId || !subscription) {
      return res.status(400).json({ error: 'participantId and subscription are required' });
    }

    // Store subscription (TODO: implement database storage)
    NotificationService.storeSubscription(participantId, subscription);
    
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error, participantId: req.body.participantId }, 'Error subscribing to notifications');
    const message = error instanceof Error ? error.message : 'Failed to subscribe to notifications';
    res.status(500).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

