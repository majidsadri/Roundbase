import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 400 });
    }

    const { investor, project } = await req.json();
    if (!investor || !project) {
      return NextResponse.json({ error: 'Missing investor or project data' }, { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.6,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a world-class fundraising strategist who helps startup founders get meetings with VCs. You deeply understand how VCs think, what makes them respond, and how to stand out in a crowded inbox.

Given an investor and a startup, generate three things:

1. **Intel Brief** — A concise research dossier on the investor. Include:
   - Their investment thesis and what excites them
   - 2-3 of their most relevant recent investments (2023-2025) and why they matter
   - Any public statements, tweets, podcast appearances, or blog posts that reveal their thinking
   - Specific angles where this startup aligns with their thesis
   - Potential concerns they might have

2. **Warm Intro Blurb** — A short, forwardable message (3-4 sentences) that a mutual connection could send on the founder's behalf. It should:
   - Sound natural, like a text from a friend
   - Lead with why the investor specifically would care
   - Include one compelling metric or proof point
   - End with a soft ask

3. **Approach Strategy** — The recommended way to reach this investor:
   - Best channel (cold email, warm intro, Twitter DM, LinkedIn, event, etc.)
   - Timing advice
   - What to lead with (thesis fit, traction, team, market timing)
   - What NOT to do with this specific investor
   - A specific "attention hook" — one sentence that would make them stop scrolling

Return JSON:
{
  "intelBrief": {
    "thesis": "Their core investment thesis in 1-2 sentences",
    "recentDeals": [
      { "company": "Company Name", "why": "Why this deal is relevant to the founder" }
    ],
    "publicInsights": ["Insight from a podcast/tweet/blog"],
    "alignmentPoints": ["Why this startup fits their thesis"],
    "concerns": ["Potential objections they might raise"]
  },
  "warmIntroBlurb": "The forwardable intro message",
  "approachStrategy": {
    "bestChannel": "Recommended outreach channel",
    "timing": "When to reach out",
    "leadWith": "What angle to open with",
    "avoid": "What NOT to do",
    "attentionHook": "One killer sentence to grab attention"
  }
}

Rules:
- Be specific, not generic. Reference real things about the investor and firm.
- If you don't know specific details, make intelligent inferences based on the firm's known focus, stage, and geography.
- Every recommendation should be actionable, not vague.
- The warm intro blurb should feel like something a real person would forward, not marketing copy.
- The attention hook should be surprising or contrarian — something that breaks pattern.`,
          },
          {
            role: 'user',
            content: `INVESTOR:
- Name: ${investor.name}
- Firm: ${investor.firm}
- Role: ${investor.role || 'Investor'}
- Sectors: ${investor.sectors?.join(', ') || 'Technology'}
- Check Size: ${investor.checkSize || 'Not specified'}
- Stage Focus: ${investor.stage || 'Not specified'}
- Location: ${investor.location || 'Not specified'}
- Intro Path: ${investor.introPath || 'None known'}
- Notes: ${investor.notes || 'None'}

STARTUP:
- Name: ${project.name}
- Description: ${project.description || 'Not provided'}
- Stage: ${project.stage || 'Seed'}
- Sectors: ${(project.sectors || []).join(', ') || 'Technology'}
- Raise Amount: ${project.raiseAmount || 'Not specified'}
- Website: ${project.website || 'Not provided'}
- Location: ${project.location || 'Not specified'}
- Traction: ${project.traction || 'Not specified'}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      const result = JSON.parse(content);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
