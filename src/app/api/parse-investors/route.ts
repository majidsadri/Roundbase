import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text, projectDescription, projectStage } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY not configured' },
      { status: 500 }
    );
  }

  const systemPrompt = `You are a data parser. Extract structured investor data from raw pasted text (typically from NFX Signal investor tables).

Return a JSON array of investor objects with these fields:
- name: string (investor's full name)
- firm: string (VC firm name)
- role: string (e.g. "Managing Partner", "General Partner")
- introStrength: string (e.g. "n/a", "Strong", etc.)
- checkSize: string (e.g. "$1M")
- checkRange: string (e.g. "$750K - $1.3M")
- locations: string[] (e.g. ["Los Angeles (CA)", "San Francisco (CA)"])
- categories: string[] (deduplicated, e.g. ["SMB Software (Seed)", "AI (Pre-seed)"])

Project context for relevance scoring:
- Project: ${projectDescription}
- Stage: ${projectStage}

Parse ALL investors from the text. Deduplicate categories. Return ONLY valid JSON array, no markdown fences.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text.slice(0, 30000) },
        ],
        temperature: 0,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    // Parse JSON from response (strip markdown fences if present)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const investors = JSON.parse(jsonStr);

    return NextResponse.json({ investors });
  } catch (err) {
    return NextResponse.json(
      { error: `Parse failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
