import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenAI API key configured. Set OPENAI_API_KEY in your environment.' }, { status: 400 });
    }

    const { project, feedback, currentDeck, theme } = await req.json();

    if (!project) {
      return NextResponse.json({ error: 'Missing project data' }, { status: 400 });
    }

    const deckSchema = `{
  "tagline": "A short compelling tagline (max 10 words)",
  "problemTitle": "The Problem",
  "problem": "2-3 sentences describing the problem being solved",
  "solutionTitle": "The Solution",
  "solution": "2-3 sentences describing how this startup solves it",
  "howItWorks": ["Step 1 description", "Step 2 description", "Step 3 description"],
  "marketSize": "TAM / market size estimate (e.g. $50B)",
  "marketDescription": "1 sentence about the market opportunity",
  "traction": ["Traction point 1", "Traction point 2", "Traction point 3"],
  "businessModel": "1-2 sentences on how the company makes money",
  "competitiveEdge": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "askAmount": "The raise amount",
  "useOfFunds": [
    {"category": "Product Development", "percentage": 40},
    {"category": "Growth & Marketing", "percentage": 30},
    {"category": "Operations", "percentage": 20},
    {"category": "Reserve", "percentage": 10}
  ],
  "vision": "1-2 sentences about the long-term vision",
  "contactEmail": "",
  "contactWebsite": ""
}`;

    const messages: { role: string; content: string }[] = [
      {
        role: 'system',
        content: `You are an expert startup pitch deck writer and designer. Generate or refine a compelling 2-page pitch deck for a startup. Return a JSON object with exactly this structure:\n\n${deckSchema}\n\nMake the content specific, compelling, and tailored to the startup's details. Use concrete numbers where possible. Be concise but impactful. Every sentence should sell the opportunity. Return ONLY valid JSON, no other text.`,
      },
    ];

    if (currentDeck && feedback) {
      // Refinement mode: modify existing deck based on feedback
      messages.push({
        role: 'user',
        content: `Here is the startup info:

Name: ${project.name}
Description: ${project.description || 'Not provided'}
Stage: ${project.stage || 'Early stage'}
Sectors: ${(project.sectors || []).join(', ') || 'Technology'}
Raise Amount: ${project.raiseAmount || 'Not specified'}
Location: ${project.location || 'Not specified'}
Website: ${project.website || 'Not specified'}
Target Investors: ${project.targetInvestors || 'Not specified'}
${theme ? `\nDesired theme/style: ${theme}` : ''}

Here is the CURRENT pitch deck content:
${JSON.stringify(currentDeck, null, 2)}

The user wants these changes:
"${feedback}"

Please modify the pitch deck based on this feedback. Keep what's good, change what the user asked for. Return the complete updated JSON object.`,
      });
    } else {
      // Initial generation
      messages.push({
        role: 'user',
        content: `Generate a pitch deck for this startup:

Name: ${project.name}
Description: ${project.description || 'Not provided'}
Stage: ${project.stage || 'Early stage'}
Sectors: ${(project.sectors || []).join(', ') || 'Technology'}
Raise Amount: ${project.raiseAmount || 'Not specified'}
Location: ${project.location || 'Not specified'}
Website: ${project.website || 'Not specified'}
Target Investors: ${project.targetInvestors || 'Not specified'}
${theme ? `\nDesired theme/style: ${theme}` : ''}`,
      });
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
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const deck = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Fill in contact info from project
    deck.contactWebsite = project.website || deck.contactWebsite || '';
    deck.contactEmail = deck.contactEmail || '';
    deck.askAmount = deck.askAmount || project.raiseAmount || '';

    return NextResponse.json({ deck });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
