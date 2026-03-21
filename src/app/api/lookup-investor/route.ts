import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 400 });
    }

    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a venture capital research assistant. Given an investor name or VC firm name, return detailed information about them.

Return a JSON object:
{
  "type": "firm" or "person",
  "name": "Full name of person or firm",
  "firm": "Firm name (same as name if type=firm, or the firm they work at if type=person)",
  "role": "Their role/title (empty if type=firm)",
  "website": "https://firm-website.com",
  "teamPageUrl": "https://firm-website.com/team or /people",
  "description": "Brief description of the firm or person (1-2 sentences)",
  "stage": "What stages they invest in (e.g. Seed, Series A, Growth)",
  "sectors": ["sector1", "sector2", "sector3"],
  "location": "City, State/Country",
  "checkSize": "$500K - $5M typical range",
  "notableInvestments": ["Company1", "Company2", "Company3"],
  "email": "contact email if publicly known, empty string if not",
  "linkedin": "LinkedIn URL if known, empty string if not",
  "aum": "Assets under management if known (e.g. $2B)"
}

IMPORTANT:
- Only return information you are confident is accurate
- Use the firm's actual domain for website (NOT crunchbase/linkedin links)
- If you don't recognize the name, still return your best attempt with what you know
- For unknown fields, use empty strings or empty arrays`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
