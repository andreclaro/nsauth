import { NextRequest, NextResponse } from 'next/server';
import { setVerificationResult } from '../../../../lib/verification-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different callback formats
    // Format 1: { sessionId, result }
    // Format 2: { sessionId, verified, uniqueIdentifier, result } (direct from ZKPassport)
    const { sessionId, result, verified, uniqueIdentifier } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Normalize the result format
    const normalizedResult = result || {
      verified: verified ?? false,
      uniqueIdentifier,
      result: body.result,
    };

    setVerificationResult(sessionId, normalizedResult);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for URL-based callbacks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const verified = searchParams.get('verified') === 'true';
    const uniqueIdentifier = searchParams.get('uniqueIdentifier');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    const result = {
      verified,
      uniqueIdentifier: uniqueIdentifier || undefined,
      result: Object.fromEntries(searchParams.entries()),
    };

    setVerificationResult(sessionId, result);

    // Return a simple HTML page for browser redirects
    return new NextResponse(
      '<html><body><h1>Verification received</h1><p>You can close this window.</p></body></html>',
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

