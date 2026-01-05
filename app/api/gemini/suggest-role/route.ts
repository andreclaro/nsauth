import { NextRequest, NextResponse } from 'next/server';

interface GeminiModel {
  name?: string;
  supportedGenerationMethods?: string[];
}

const ROLES = [
  // Government & Public Service
  'Executive Leader / President',
  'Legislative Council',
  'Treasury / Finance Minister',
  'Justice & Legal Affairs',
  'Defense & Security',
  'Diplomacy & International Relations',
  'Infrastructure & Public Works',
  'Immigration & Citizenship',
  'Economic Development',
  'Communications & Media',
  'Community Outreach & Civic Engagement',
  
  // Professional Services
  'Technology & Innovation',
  'Education & Research',
  'Health & Human Services',
  'Culture & Arts',
  'Environment & Sustainability',
  'Legal & Compliance',
  'Consulting & Advisory',
  
  // Business & Commerce
  'Sales & Marketing',
  'Human Resources',
  'Operations & Logistics',
  'Retail & E-commerce',
  'Real Estate & Construction',
  
  // Service Industries
  'Hospitality & Tourism',
  'Customer Service',
  'Design & Creative',
  
  // Other Sectors
  'Agriculture & Food',
  'Transportation & Logistics',
  'Non-profit & Social Services',
  
  // Generic Categories
  'General / Other',
  'Freelance / Independent Contractor',
  'Student / Intern',
  'Retired',
  'Unemployed / Seeking Opportunity',
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

    // First, try to get available models (for debugging in development)
    let availableModels: string[] = [];
    if (process.env.NODE_ENV === 'development') {
      try {
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const modelsResponse = await fetch(listModelsUrl);
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json() as { models?: GeminiModel[] };
          if (modelsData.models) {
            availableModels = modelsData.models
              .filter((m: GeminiModel) => m.supportedGenerationMethods?.includes('generateContent'))
              .map((m: GeminiModel) => m.name?.replace('models/', '') || m.name)
              .filter((name): name is string => name !== undefined);
            console.log('Available Gemini models:', availableModels);
          }
        }
      } catch (error) {
        console.warn('Could not fetch available models:', error);
      }
    }

    // Construct the prompt for Gemini
    const rolesList = ROLES.map((role, index) => `${index + 1}. ${role}`).join('\n');
    const prompt = `You are an expert at categorizing professional profiles. Analyze the following profile description and select the SINGLE most appropriate role category from the list below.

Profile description:
"${about.trim()}"

Available role categories:
${rolesList}

Instructions:
- Analyze the profile description carefully
- Consider the person's profession, skills, industry, and work context
- Select the ONE category that best represents their primary role or field
- Return ONLY the exact category name as it appears in the list above
- Do not add any explanation, numbering, or additional text

Important categorization guidelines:
- Technology roles (developer, engineer, programmer, software, IT, tech, coding, etc.) → "Technology & Innovation"
- Business development, sales, marketing → "Sales & Marketing"
- Education, teaching, research, academic → "Education & Research"
- Healthcare, medical, doctor, nurse → "Health & Human Services"
- Finance, accounting, banking → "Treasury / Finance Minister"
- Legal, lawyer, attorney → "Legal & Compliance"
- Design, creative, artist → "Design & Creative"
- Only use "General / Other" if the profile truly doesn't fit any specific category

Return only the exact category name:`;

    // Call Gemini API - try different model/version combinations
    let suggestedRole: string | null = null;
    let lastGeminiResponse: string | null = null;
    
    // Build list of models to try - prioritize available models if we fetched them
    let modelConfigs = [
      { version: 'v1beta', model: 'gemini-pro' }, // Most widely available
      { version: 'v1beta', model: 'gemini-1.5-pro' },
      { version: 'v1', model: 'gemini-1.5-pro' },
      { version: 'v1beta', model: 'gemini-1.5-flash' },
      { version: 'v1', model: 'gemini-1.5-flash' },
    ];
    
    // If we have available models, prioritize those
    if (availableModels.length > 0) {
      const prioritizedConfigs: typeof modelConfigs = [];
      for (const availableModel of availableModels) {
        // Try v1beta first, then v1
        prioritizedConfigs.push({ version: 'v1beta', model: availableModel });
        prioritizedConfigs.push({ version: 'v1', model: availableModel });
      }
      // Add fallback configs that weren't in the available list
      for (const config of modelConfigs) {
        if (!prioritizedConfigs.some(c => c.model === config.model && c.version === config.version)) {
          prioritizedConfigs.push(config);
        }
      }
      modelConfigs = prioritizedConfigs;
    }
    
    outerLoop: for (const config of modelConfigs) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${apiKey}`;
        console.log(`Trying Gemini API: ${config.version}/${config.model}`);
        
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
          console.error(`Gemini API error (${config.version}/${config.model}):`, response.status, errorText);
          lastGeminiResponse = `Error ${response.status}: ${errorText}`;
          continue; // Try next model/version
        }

        const data = await response.json();
        
        // Log full response structure for debugging
        console.log(`Gemini API full response (${config.version}/${config.model}):`, JSON.stringify(data, null, 2));
        
        // Extract the suggested role from the response
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const text = data.candidates[0].content.parts[0]?.text || '';
          const trimmedText = text.trim();
          lastGeminiResponse = trimmedText;
          
          // Log the raw response for debugging
          console.log(`Gemini API response (${config.version}/${config.model}):`, JSON.stringify(trimmedText));
          
          if (!trimmedText) {
            console.warn(`Empty response from Gemini API (${config.version}/${config.model})`);
            continue;
          }
          
          // Normalize the text: remove quotes, extra whitespace, and make lowercase for comparison
          const normalizedText = trimmedText
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/^[0-9]+\.\s*/, '') // Remove leading numbers like "1. "
            .replace(/^category:\s*/i, '') // Remove "Category:" prefix
            .replace(/^role:\s*/i, '') // Remove "Role:" prefix
            .trim()
            .toLowerCase();
          
          console.log(`Normalized text:`, normalizedText);
          
          // Try to find an exact match (case-insensitive, ignoring quotes and numbers)
          for (const role of ROLES) {
            const normalizedRole = role.toLowerCase();
            if (normalizedText === normalizedRole || normalizedText.includes(normalizedRole)) {
              suggestedRole = role;
              console.log(`✅ Matched role (exact): ${role}`);
              break;
            }
          }
          
          // If no exact match, try to find a partial match using the first line
          if (!suggestedRole) {
            const firstLine = trimmedText.split('\n')[0]
              .replace(/^["']|["']$/g, '')
              .replace(/^[0-9]+\.\s*/, '')
              .replace(/^category:\s*/i, '')
              .replace(/^role:\s*/i, '')
              .trim()
              .toLowerCase();
            
            console.log(`First line:`, firstLine);
            
            for (const role of ROLES) {
              const normalizedRole = role.toLowerCase();
              if (firstLine === normalizedRole || 
                  firstLine.includes(normalizedRole) || 
                  normalizedRole.includes(firstLine)) {
                suggestedRole = role;
                console.log(`✅ Matched role (partial): ${role}`);
                break;
              }
            }
          }
          
          // Try fuzzy matching - check if any role name appears anywhere in the response
          if (!suggestedRole) {
            // Remove common prefixes/suffixes that might confuse matching
            const cleanedText = normalizedText
              .replace(/^(the|a|an)\s+/i, '')
              .replace(/\s+(category|role|field|sector|would|be|is)$/i, '')
              .trim();
            
            console.log(`Cleaned text for fuzzy matching:`, cleanedText);
            
            for (const role of ROLES) {
              const normalizedRole = role.toLowerCase();
              
              // Check if role name appears as substring (more lenient)
              if (cleanedText.includes(normalizedRole) || normalizedRole.includes(cleanedText)) {
                suggestedRole = role;
                console.log(`✅ Matched role (substring): ${role}`);
                break;
              }
              
              // Check if significant words from role name appear in response
              const roleWords = normalizedRole.split(/\s*\/\s*|\s+/);
              const significantWords = roleWords
                .filter(w => w.length > 2)
                .filter(w => !['and', 'the', 'for', 'of', 'in', 'or', 'other'].includes(w));
              
              if (significantWords.length > 0) {
                const matches = significantWords.filter(word => cleanedText.includes(word));
                // If at least 50% of significant words match (lowered threshold), consider it a match
                const matchThreshold = Math.max(1, Math.ceil(significantWords.length * 0.5));
                if (matches.length >= matchThreshold) {
                  suggestedRole = role;
                  console.log(`✅ Matched role (fuzzy): ${role} (matched ${matches.length}/${significantWords.length} words: ${matches.join(', ')})`);
                  break;
                }
              }
            }
          }
          
          // Last resort: try matching individual words from response against role names
          if (!suggestedRole) {
            const responseWords = normalizedText.split(/\s+/).filter((w: string) => w.length > 3);
            console.log(`Trying word-by-word matching with words:`, responseWords);
            
            for (const role of ROLES) {
              const normalizedRole = role.toLowerCase();
              const roleWords = normalizedRole.split(/\s*\/\s*|\s+/).filter(w => w.length > 3);
              
              // Check if any significant word from response matches any word in role name
              for (const responseWord of responseWords) {
                for (const roleWord of roleWords) {
                  if (responseWord.includes(roleWord) || roleWord.includes(responseWord)) {
                    suggestedRole = role;
                    console.log(`✅ Matched role (word match): ${role} (matched "${responseWord}" with "${roleWord}")`);
                    break;
                  }
                }
                if (suggestedRole) break;
              }
              if (suggestedRole) break;
            }
          }
          
          // If we found a role, break out of both loops
          if (suggestedRole) {
            break outerLoop;
          } else {
            console.warn(`❌ No match found for response: "${trimmedText}"`);
          }
        } else {
          console.warn(`Unexpected response structure from Gemini API (${config.version}/${config.model}):`, JSON.stringify(data));
          // Try to extract text from alternative response structures
          if (data.candidates && data.candidates[0]) {
            const candidate = data.candidates[0];
            // Check for different response formats
            if (candidate.text) {
              lastGeminiResponse = candidate.text.trim();
              console.log(`Found text in candidate.text:`, lastGeminiResponse);
            } else if (candidate.output) {
              lastGeminiResponse = candidate.output.trim();
              console.log(`Found text in candidate.output:`, lastGeminiResponse);
            }
          }
        }
      } catch (error) {
        console.error(`Error calling Gemini API (${config.version}/${config.model}):`, error);
        continue; // Try next model/version
      }
    }

    // If Gemini API failed completely, return null
    if (!suggestedRole) {
      console.warn('Could not get role suggestion from any Gemini model');
      // In development, return debug info
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          role: null,
          debug: 'No role matched.',
          geminiResponse: lastGeminiResponse || 'No response received from Gemini API'
        });
      }
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

