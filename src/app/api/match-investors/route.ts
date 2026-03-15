import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 400 });
    }

    const { project, investors } = await req.json();

    if (!project || !investors || !Array.isArray(investors)) {
      return NextResponse.json({ error: 'Missing project or investors data' }, { status: 400 });
    }

    // Build a concise representation for the AI
    const investorSummaries = investors.map((inv: { id: string; name: string; firm: string; sectors: string[]; stage: string; checkSize: string; location: string }) => ({
      id: inv.id,
      name: inv.name,
      firm: inv.firm,
      sectors: inv.sectors,
      stage: inv.stage,
      checkSize: inv.checkSize,
      location: inv.location,
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are an expert fundraising advisor. Given a startup project and a list of investors, score each investor's fit (0-100) and explain why in 1-2 short reasons. Consider: stage alignment, sector overlap, check size fit, location proximity, and general strategic fit. Return JSON array: [{"id": "...", "score": N, "reasons": ["...", "..."]}]. Only include investors with score > 20. Sort by score descending. Return max 15.`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              project: {
                name: project.name,
                description: project.description,
                stage: project.stage,
                sectors: project.sectors,
                raiseAmount: project.raiseAmount,
                location: project.location,
              },
              investors: investorSummaries,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    // Parse the JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const matches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
