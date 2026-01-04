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
          
          // Log the raw response for debugging
          console.log(`Gemini API response (${model}):`, trimmedText);
          
          // Normalize the text: remove quotes, extra whitespace, and make lowercase for comparison
          const normalizedText = trimmedText
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/^[0-9]+\.\s*/, '') // Remove leading numbers like "1. "
            .trim()
            .toLowerCase();
          
          // Try to find an exact match (case-insensitive, ignoring quotes and numbers)
          for (const role of ROLES) {
            const normalizedRole = role.toLowerCase();
            if (normalizedText === normalizedRole || normalizedText.includes(normalizedRole)) {
              suggestedRole = role;
              console.log(`Matched role: ${role}`);
              break;
            }
          }
          
          // If no exact match, try to find a partial match using the first line
          if (!suggestedRole) {
            const firstLine = trimmedText.split('\n')[0]
              .replace(/^["']|["']$/g, '')
              .replace(/^[0-9]+\.\s*/, '')
              .trim()
              .toLowerCase();
            
            for (const role of ROLES) {
              const normalizedRole = role.toLowerCase();
              if (firstLine === normalizedRole || 
                  firstLine.includes(normalizedRole) || 
                  normalizedRole.includes(firstLine)) {
                suggestedRole = role;
                console.log(`Matched role (partial): ${role}`);
                break;
              }
            }
          }
          
          // If still no match, try word-based matching for common keywords
          if (!suggestedRole) {
            // Split by whitespace and also handle apostrophes (e.g., "I'm" -> ["i", "m"])
            const keywords = normalizedText
              .replace(/'/g, ' ') // Replace apostrophes with spaces
              .split(/\s+/)
              .filter((k: string) => k.length > 0);
            
            const keywordMap: Record<string, string> = {
              'developer': 'Technology & Innovation',
              'programmer': 'Technology & Innovation',
              'engineer': 'Technology & Innovation',
              'tech': 'Technology & Innovation',
              'software': 'Technology & Innovation',
              'code': 'Technology & Innovation',
              'coding': 'Technology & Innovation',
              'president': 'Executive Leader / President',
              'executive': 'Executive Leader / President',
              'leader': 'Executive Leader / President',
              'education': 'Education & Research',
              'teacher': 'Education & Research',
              'research': 'Education & Research',
              'health': 'Health & Human Services',
              'doctor': 'Health & Human Services',
              'medical': 'Health & Human Services',
              'finance': 'Treasury / Finance Minister',
              'treasury': 'Treasury / Finance Minister',
              'economic': 'Economic Development',
              'economy': 'Economic Development',
            };
            
            for (const keyword of keywords) {
              if (keywordMap[keyword]) {
                suggestedRole = keywordMap[keyword];
                console.log(`Matched role (keyword): ${suggestedRole} from keyword: ${keyword}`);
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

    // If Gemini API failed, try keyword matching as fallback on the original input
    if (!suggestedRole) {
      console.warn('Could not get role suggestion from any Gemini model, trying keyword fallback');
      const normalizedInput = about.trim().toLowerCase().replace(/'/g, ' ');
      const keywords = normalizedInput.split(/\s+/).filter((k: string) => k.length > 0);
      
      const keywordMap: Record<string, string> = {
        'developer': 'Technology & Innovation',
        'programmer': 'Technology & Innovation',
        'engineer': 'Technology & Innovation',
        'tech': 'Technology & Innovation',
        'software': 'Technology & Innovation',
        'code': 'Technology & Innovation',
        'coding': 'Technology & Innovation',
        'president': 'Executive Leader / President',
        'executive': 'Executive Leader / President',
        'leader': 'Executive Leader / President',
        'education': 'Education & Research',
        'teacher': 'Education & Research',
        'research': 'Education & Research',
        'health': 'Health & Human Services',
        'doctor': 'Health & Human Services',
        'medical': 'Health & Human Services',
        'finance': 'Treasury / Finance Minister',
        'treasury': 'Treasury / Finance Minister',
        'economic': 'Economic Development',
        'economy': 'Economic Development',
      };
      
      for (const keyword of keywords) {
        if (keywordMap[keyword]) {
          suggestedRole = keywordMap[keyword];
          console.log(`Matched role (fallback keyword): ${suggestedRole} from keyword: ${keyword}`);
          break;
        }
      }
    }

    if (!suggestedRole) {
      console.warn('Could not get role suggestion from any method');
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

