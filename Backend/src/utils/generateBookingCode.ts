export const generateBookingCode = (prefix: string = 'BK'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  
  // Generate random alphanumeric string
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Combine prefix, timestamp, and random for uniqueness
  return `${prefix}-${timestamp}-${random}`;
};