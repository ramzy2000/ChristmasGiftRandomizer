import { Request, Response, NextFunction } from 'express';

export function validateExchangeName(req: Request, res: Response, next: NextFunction) {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Exchange name is required and must be a string' });
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 100) {
    return res.status(400).json({ error: 'Exchange name must be between 3 and 100 characters' });
  }
  
  // Sanitize - remove potentially dangerous characters
  if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(trimmed)) {
    return res.status(400).json({ error: 'Exchange name contains invalid characters' });
  }
  
  req.body.name = trimmed;
  next();
}

export function validateParticipantName(req: Request, res: Response, next: NextFunction) {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Participant name is required and must be a string' });
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return res.status(400).json({ error: 'Participant name must be between 2 and 50 characters' });
  }
  
  // Sanitize
  if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(trimmed)) {
    return res.status(400).json({ error: 'Participant name contains invalid characters' });
  }
  
  req.body.name = trimmed;
  next();
}

export function validateExcludedNames(req: Request, res: Response, next: NextFunction) {
  const { excludedNames } = req.body;
  
  if (excludedNames !== undefined) {
    if (!Array.isArray(excludedNames)) {
      return res.status(400).json({ error: 'excludedNames must be an array' });
    }
    
    if (excludedNames.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 excluded names allowed' });
    }
    
    // Validate each excluded name
    for (const name of excludedNames) {
      if (typeof name !== 'string') {
        return res.status(400).json({ error: 'All excluded names must be strings' });
      }
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        return res.status(400).json({ error: 'Excluded names must be between 2 and 50 characters' });
      }
    }
    
    req.body.excludedNames = excludedNames.map((n: string) => n.trim()).filter((n: string) => n.length > 0);
  }
  
  next();
}

export function validateToken(req: Request, res: Response, next: NextFunction) {
  const { token } = req.params;
  
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return res.status(400).json({ error: 'Invalid token format' });
  }
  
  next();
}

export function validateParticipantCode(req: Request, res: Response, next: NextFunction) {
  const { code } = req.params;
  
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Participant code is required' });
  }
  
  if (code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
    return res.status(400).json({ error: 'Invalid participant code format' });
  }
  
  next();
}

