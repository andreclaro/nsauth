import { NextRequest, NextResponse } from 'next/server';
import { getVerificationResult } from '../../../../../lib/verification-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const result = getVerificationResult(sessionId);

  if (result) {
    return NextResponse.json({ found: true, result });
  }

  return NextResponse.json({ found: false });
}

