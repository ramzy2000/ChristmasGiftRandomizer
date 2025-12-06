export function validateParticipantName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: `Name must be less than 50 characters (currently ${trimmed.length})` };
  }
  
  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true };
}

export function validateExchangeName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Exchange name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Exchange name must be at least 3 characters' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: `Exchange name must be less than 100 characters (currently ${trimmed.length})` };
  }
  
  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { valid: false, error: 'Exchange name contains invalid characters' };
  }
  
  return { valid: true };
}

export function validateParticipantCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim() === '') {
    return { valid: false, error: 'Participant code is required' };
  }
  
  const trimmed = code.trim().toUpperCase();
  
  if (trimmed.length !== 6) {
    return { valid: false, error: `Participant code must be exactly 6 characters (received ${trimmed.length})` };
  }
  
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: 'Participant code must contain only letters and numbers' };
  }
  
  return { valid: true };
}

