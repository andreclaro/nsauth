// Shared store for verification results between API routes
// In production, use Redis or a database instead

const verificationResults = new Map<string, {
  result: any;
  timestamp: number;
}>();

export function setVerificationResult(sessionId: string, result: any) {
  verificationResults.set(sessionId, {
    result,
    timestamp: Date.now(),
  });
}

export function getVerificationResult(sessionId: string): any | null {
  const data = verificationResults.get(sessionId);
  if (data) {
    verificationResults.delete(sessionId); // Clean up after reading
    return data.result;
  }
  return null;
}

export function hasVerificationResult(sessionId: string): boolean {
  return verificationResults.has(sessionId);
}

// Cleanup old results (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  
  for (const [sessionId, data] of verificationResults.entries()) {
    if (now - data.timestamp > tenMinutes) {
      verificationResults.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

