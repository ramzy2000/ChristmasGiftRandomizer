import { Request, Response, NextFunction } from 'express';

export function validateExchangeName(req: Request, res: Response, next: NextFunction) {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Exchange name is required and must be a string' });
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 100) {
    return res.status(400).json({ 
      error: 'Exchange name must be between 3 and 100 characters',
      details: `Received ${trimmed.length} characters`
    });
  }
  
  // Allow unicode characters, but prevent control characters and potentially dangerous sequences
  // Allow letters (including unicode), numbers, spaces, and common punctuation
  if (!/^[\p{L}\p{N}\s\-_.,!?()']+$/u.test(trimmed)) {
    return res.status(400).json({ 
      error: 'Exchange name contains invalid characters',
      details: 'Only letters, numbers, spaces, and common punctuation are allowed'
    });
  }
  
  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return res.status(400).json({ error: 'Exchange name contains invalid control characters' });
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
    return res.status(400).json({ 
      error: 'Participant name must be between 2 and 50 characters',
      details: `Received ${trimmed.length} characters`
    });
  }
  
  // Allow unicode characters (supports international names)
  // Allow letters (including unicode), numbers, spaces, hyphens, and common punctuation
  if (!/^[\p{L}\p{N}\s\-_.,!?()']+$/u.test(trimmed)) {
    return res.status(400).json({ 
      error: 'Participant name contains invalid characters',
      details: 'Only letters, numbers, spaces, and common punctuation are allowed'
    });
  }
  
  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return res.status(400).json({ error: 'Participant name contains invalid control characters' });
  }
  
  req.body.name = trimmed;
  next();
}

export function validateExcludedNames(req: Request, res: Response, next: NextFunction) {
  const { excludedNames } = req.body;
  
  if (excludedNames !== undefined) {
    if (!Array.isArray(excludedNames)) {
      return res.status(400).json({ 
        error: 'excludedNames must be an array',
        details: `Received type: ${typeof excludedNames}`
      });
    }
    
    if (excludedNames.length > 10) {
      return res.status(400).json({ 
        error: 'Maximum 10 excluded names allowed',
        details: `Received ${excludedNames.length} excluded names`
      });
    }
    
    // First, validate all items are strings
    for (let i = 0; i < excludedNames.length; i++) {
      if (typeof excludedNames[i] !== 'string') {
        return res.status(400).json({ 
          error: 'All excluded names must be strings',
          details: `Excluded name at index ${i} is not a string`
        });
      }
    }
    
    // Trim and filter empty names first
    const trimmed = excludedNames
      .map((n: string) => n.trim())
      .filter((n: string) => n.length > 0);
    
    // Now validate the trimmed names
    for (let i = 0; i < trimmed.length; i++) {
      const name = trimmed[i];
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ 
          error: 'Excluded names must be between 2 and 50 characters',
          details: `Excluded name "${name}" has ${name.length} characters`
        });
      }
      
      // Allow unicode characters
      if (!/^[\p{L}\p{N}\s\-_.,!?()']+$/u.test(name)) {
        return res.status(400).json({ 
          error: 'Excluded name contains invalid characters',
          details: `Excluded name "${name}" contains invalid characters`
        });
      }
      
      // Check for control characters
      if (/[\x00-\x1F\x7F]/.test(name)) {
        return res.status(400).json({ 
          error: 'Excluded name contains invalid control characters',
          details: `Excluded name "${name}" contains control characters`
        });
      }
    }
    
    req.body.excludedNames = trimmed;
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
    return res.status(400).json({ 
      error: 'Participant code is required',
      details: 'Participant code must be provided in the URL'
    });
  }
  
  // Normalize to uppercase for case-insensitive matching
  const normalizedCode = code.toUpperCase().trim();
  
  if (normalizedCode.length !== 6) {
    return res.status(400).json({ 
      error: 'Invalid participant code format',
      details: `Participant code must be exactly 6 characters, received ${normalizedCode.length}`
    });
  }
  
  if (!/^[A-Z0-9]+$/.test(normalizedCode)) {
    return res.status(400).json({ 
      error: 'Invalid participant code format',
      details: 'Participant code must contain only uppercase letters and numbers'
    });
  }
  
  // Update the param with normalized code
  req.params.code = normalizedCode;
  next();
}

