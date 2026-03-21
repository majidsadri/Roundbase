import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 400 });
    }

    const { investor, project, templateType } = await req.json();
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
        model: 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert fundraising advisor helping a startup founder write a personalized cold email to a VC investor. Based on your knowledge of the investor and their firm, generate a complete, ready-to-send email.

Your job is to research what you know about this person and make the email feel personal and specific — not generic. Reference real things they've said, written, invested in, or care about.

Return a JSON object with:
{
  "subject": "Email subject line",
  "body": "Complete email body ready to send",
  "researchNotes": "Brief notes on what you found about this investor (for the sender to review)"
}

Rules:
- Write as if you are the founder, in first person
- Keep it under 150 words — investors skim
- Open with something specific about the investor (a podcast quote, a tweet, a recent investment, a blog post, their known thesis)
- If the investor backed a competitor, frame it positively ("you have thesis conviction in this space")
- Mention 1-2 of their recent investments (2023-2025), not old ones
- End with a clear, low-friction ask (15-min call)
- Sound human, not salesy — like a smart founder who did their homework
- Do NOT use placeholder brackets like [Topic] — write real content based on what you know
- If you don't know much about this specific person, focus on what you know about the firm and be honest about the connection point
- Sign off with {{sender_name}} as placeholder for the founder's name`,
          },
          {
            role: 'user',
            content: `Write a ${templateType || 'cold intro'} email.

INVESTOR:
- Name: ${investor.name}
- Firm: ${investor.firm}
- Role: ${investor.role || 'Investor'}
- Sectors: ${investor.sectors?.join(', ') || 'Technology'}
- Check Size: ${investor.checkSize || 'Not specified'}

STARTUP:
- Name: ${project.name}
- Description: ${project.description || 'Not provided'}
- Stage: ${project.stage || 'Seed'}
- Sectors: ${(project.sectors || []).join(', ') || 'Technology'}
- Raise Amount: ${project.raiseAmount || 'Not specified'}
- Website: ${project.website || 'Not provided'}`,
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
