import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 400 });
    }

    const { project, existingFirms } = await req.json();
    if (!project) {
      return NextResponse.json({ error: 'Missing project data' }, { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert venture capital advisor. Given a startup's details, suggest the most relevant VC firms that would be a great fit for investment. Return a JSON object with a "firms" key containing an array of VC firms:

{"firms": [
  {
    "name": "Firm Name",
    "website": "https://firm-website.com",
    "teamPageUrl": "https://firm-website.com/team",
    "whyFit": "Brief reason why this firm is a good fit (1 sentence)",
    "stage": "Seed/Series A/etc - what stage they typically invest",
    "sectors": ["sector1", "sector2"],
    "location": "City, State",
    "notableInvestments": ["Company1", "Company2"],
    "checkSize": "$500K - $5M"
  }
]}

Return 15-20 firms. Prioritize firms that:
1. Invest at the startup's current stage
2. Focus on the startup's sectors
3. Are geographically relevant (but include top firms regardless)
4. Have a track record in similar companies
5. Are actively investing (not dormant)

Use REAL firm names and REAL website URLs. Make sure teamPageUrl points to the firm's actual team/people/about page. Do NOT include any firms from the exclusion list. You MUST return valid JSON.`,
          },
          {
            role: 'user',
            content: `Find VC firms for this startup:

Name: ${project.name}
Description: ${project.description || 'Not provided'}
Stage: ${project.stage || 'Early stage'}
Sectors: ${(project.sectors || []).join(', ') || 'Technology'}
Raise Amount: ${project.raiseAmount || 'Not specified'}
Location: ${project.location || 'Not specified'}
Target Investors: ${project.targetInvestors || 'Not specified'}

${existingFirms?.length ? `EXCLUDE these firms (already in database): ${existingFirms.join(', ')}` : ''}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"firms":[]}';

    let firms = [];
    try {
      const parsed = JSON.parse(content);
      firms = parsed.firms || parsed;
      if (!Array.isArray(firms)) {
        // Try extracting array from the parsed object
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        firms = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
    } catch {
      // Fallback: try to extract JSON array with regex
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          firms = JSON.parse(jsonMatch[0]);
        } catch {
          // Try to fix common JSON issues (trailing commas, etc.)
          const cleaned = jsonMatch[0]
            .replace(/,\s*\]/g, ']')
            .replace(/,\s*\}/g, '}');
          try {
            firms = JSON.parse(cleaned);
          } catch {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({ firms });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
