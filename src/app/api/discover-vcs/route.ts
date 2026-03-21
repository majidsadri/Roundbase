import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 400 });
    }

    const { project, existingFirms, refinement } = await req.json();
    if (!project) {
      return NextResponse.json({ error: 'Missing project data' }, { status: 400 });
    }

    const refinementInstruction = refinement
      ? `\n\nADDITIONAL USER PREFERENCES: "${refinement}" — prioritize firms matching this criteria while still maintaining relevance to the startup.`
      : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert venture capital advisor with deep knowledge of the global VC ecosystem. Given a startup's details, suggest the most relevant VC firms that would be a great fit for investment.

CRITICAL RULES:
- Return ONLY actual venture capital firms / investment funds. Examples: "Sequoia Capital", "Andreessen Horowitz", "First Round Capital", "Benchmark".
- Do NOT return accelerators, incubators, programs, divisions, or departments (e.g. do NOT return "Hacker News", "Post Batch", "Fellowship", "Startup School", "Y Combinator").
- Do NOT return sub-groups or internal teams of a firm. Return the firm itself.
- Each firm must be a real, independently operating VC fund that writes checks to startups.
- Use the firm's actual domain for the website (e.g. "https://www.sequoia.com", NOT a crunchbase or linkedin link).
- The teamPageUrl must point to the firm's actual team/people/about page on their own website.
- Double-check that the website URL is real and correct for each firm.

Return a JSON object:
{"firms": [
  {
    "name": "Firm Name",
    "website": "https://firm-website.com",
    "teamPageUrl": "https://firm-website.com/team",
    "whyFit": "Brief reason why this firm is a good fit (1-2 sentences)",
    "stage": "Seed/Series A/etc - what stage they typically invest",
    "sectors": ["sector1", "sector2"],
    "location": "City, State/Country",
    "notableInvestments": ["Company1", "Company2", "Company3"],
    "checkSize": "$500K - $5M",
    "fitScore": 75
  }
]}

For fitScore (0-100): 85+ = perfect stage+sector+thesis match, 70-84 = strong alignment, 50-69 = good partial match, below 50 = tangential fit only.

Return 15-20 firms. Prioritize firms that:
1. Invest at the startup's current stage (most important)
2. Focus on the startup's sectors
3. Are geographically relevant (but include top global firms regardless)
4. Have a track record in similar companies
5. Are actively investing (not dormant funds)
6. Mix of well-known and emerging/underrated funds for better coverage

Do NOT include any firms from the exclusion list.${refinementInstruction}`,
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

${existingFirms?.length ? `EXCLUDE these firms (already in database or already suggested): ${existingFirms.join(', ')}` : ''}`,
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
