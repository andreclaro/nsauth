import { NextRequest, NextResponse } from 'next/server';

const ROLES = [
  'Executive Leader / President',
  'Legislative Council',
  'Treasury / Finance Minister',
  'Justice & Legal Affairs',
  'Defense & Security',
  'Diplomacy & International Relations',
  'Infrastructure & Public Works',
  'Education & Research',
  'Health & Human Services',
  'Culture & Arts',
  'Technology & Innovation',
  'Environment & Sustainability',
  'Immigration & Citizenship',
  'Economic Development',
  'Communications & Media',
  'Community Outreach & Civic Engagement',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { about } = body;

    if (!about || typeof about !== 'string' || about.trim().length === 0) {
      return NextResponse.json(
        { error: 'About field is required and must not be empty' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Construct the prompt for Gemini
    const rolesList = ROLES.map((role, index) => `${index + 1}. ${role}`).join('\n');
    const prompt = `Analyze the following profile description and select the SINGLE most appropriate role from the list below. Return ONLY the exact role name as it appears in the list, nothing else.

Profile description:
"${about.trim()}"

Available roles:
${rolesList}

Return only the exact role name that best matches the profile description.`;

    // Call Gemini API - try gemini-1.5-pro first, fallback to gemini-pro
    let suggestedRole: string | null = null;
    const models = ['gemini-1.5-pro', 'gemini-pro'];
    
    for (const model of models) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API error (${model}):`, response.status, errorText);
          continue; // Try next model
        }

        const data = await response.json();
        
        // Extract the suggested role from the response
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const text = data.candidates[0].content.parts[0]?.text || '';
          const trimmedText = text.trim();
          
          // Try to find an exact match from the roles list
          for (const role of ROLES) {
            if (trimmedText.includes(role)) {
              suggestedRole = role;
              break;
            }
          }
          
          // If no exact match, try to find a partial match or use the first line
          if (!suggestedRole) {
            const firstLine = trimmedText.split('\n')[0].trim();
            for (const role of ROLES) {
              if (firstLine === role || firstLine.includes(role) || role.includes(firstLine)) {
                suggestedRole = role;
                break;
              }
            }
          }
          
          // If we found a role, break out of model loop
          if (suggestedRole) {
            break;
          }
        }
      } catch (error) {
        console.error(`Error calling Gemini API (${model}):`, error);
        continue; // Try next model
      }
    }

    if (!suggestedRole) {
      // If all models failed, return null so client can proceed without role tag
      console.warn('Could not get role suggestion from any Gemini model');
      return NextResponse.json({ role: null });
    }

    return NextResponse.json({ role: suggestedRole });
  } catch (error) {
    console.error('Error in suggest-role API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

