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
  "contactWebsite": "",
  "socialLinks": [{"platform": "Instagram", "url": "https://instagram.com/example"}]
}`;

    const projectBrief = `STARTUP PROFILE:
- Company Name: ${project.name}
- What it does: ${project.description || 'No description provided — infer from name and sectors'}
- Stage: ${project.stage || 'Early stage'}
- Industry/Sectors: ${(project.sectors || []).join(', ') || 'Not specified'}
- Raise Amount: ${project.raiseAmount || 'Not specified'}
- Location: ${project.location || 'Not specified'}
- Website: ${project.website || 'Not specified'}
- Target Investors: ${project.targetInvestors || 'Not specified'}
- Existing Files: ${(project.files || []).map((f: { name: string; type: string }) => `${f.name} (${f.type})`).join(', ') || 'None'}
${theme ? `- Desired theme/style: ${theme}` : ''}`;

    const systemPrompt = `You are an elite pitch deck strategist who has helped raise over $2B across 200+ startups (YC, a16z, Sequoia portfolio companies). You write pitch decks that actually close rounds.

CRITICAL RULES — follow these exactly:
1. **Ground every claim in the startup's actual data.** If the description says "AI-powered scheduling for dentists", the problem MUST be about dentist scheduling, the solution MUST describe their AI scheduling tool, and the market MUST be dental/healthcare SaaS. NEVER generate generic startup filler.
2. **The tagline must capture what this specific company does** — not a generic motivational phrase. Bad: "Revolutionizing the Future". Good: "AI scheduling that fills every chair in your practice".
3. **Problem and solution must be a matched pair.** The problem describes a real pain point in the startup's specific industry. The solution describes exactly how THIS company solves it — name the product, name the approach.
4. **How It Works steps must describe the actual product flow** — what a user does, step by step. Not vague strategy statements.
5. **Market size must be realistic for the sector.** Research-quality TAM estimates, not inflated numbers. A dental SaaS startup is not a $500B market.
6. **Traction points:** If the startup is pre-seed/seed with no stated traction, use credibility signals instead (team background, waitlist, LOIs, pilot customers, design partners). Never fabricate specific revenue numbers or user counts unless the description mentions them.
7. **Business model must match the product type.** SaaS = subscription pricing. Marketplace = take rate. Consumer = freemium/ads. Be specific about pricing structure.
8. **Competitive advantages must be defensible and specific** to this company — not generic ("great team", "first mover"). Think: proprietary data, unique distribution, technical moat, regulatory advantage.
9. **Use of funds must be realistic for the stage and raise amount.** A $500K pre-seed allocates differently than a $10M Series A.
10. **Contact info:** Use the project's actual website. Leave email blank if not provided — never fabricate contact details.
11. **Social links:** If the user mentions social media (Instagram, LinkedIn, Twitter/X, Facebook, YouTube, TikTok), add them to the "socialLinks" array with platform name and URL. If the user says to get links from the website, infer common social URLs from the company domain/name. Always include social links when the user asks for them.

Return ONLY a valid JSON object matching this exact schema (no markdown, no explanation):

${deckSchema}`;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (currentDeck && feedback) {
      // ─── Refinement mode ────────────────────────────────────
      messages.push({
        role: 'assistant',
        content: JSON.stringify(currentDeck, null, 2),
      });
      messages.push({
        role: 'user',
        content: `${projectBrief}

The user wants to refine the pitch deck above. Here is their request:

"${feedback}"

─── INSTRUCTIONS FOR REFINEMENT ───

You are refining an existing pitch deck. Think like a senior product manager and creative director reviewing a deck before a real investor meeting. Follow these rules precisely:

1. **UNDERSTAND THE INTENT**: Read the user's feedback carefully. Identify exactly what they want changed. Users often speak casually — interpret their intent generously:
   - "make it better" → improve clarity, punch, and specificity across all fields
   - "too long" → shorten text, tighten language, cut filler words
   - "more professional" → formal tone, precise language, remove casual phrasing
   - "add X" → add the requested content (social links, traction points, team info, etc.)
   - "change X to Y" → make the exact substitution requested
   - "the problem section doesn't feel right" → rewrite the problem to be more compelling and specific
   - Any mention of social media, Instagram, LinkedIn, etc. → add to socialLinks array with correct URLs

2. **FIELD MAPPING** — when users reference parts of the deck by common names, map to the correct fields:
   - "title", "headline", "heading", "main text", "cover" → "tagline"
   - "subtitle", "subheading", "description under title" → project description (reflected in tagline context)
   - "problem", "pain point", "challenge" → "problem" and "problemTitle"
   - "solution", "what we do", "our product" → "solution" and "solutionTitle"
   - "steps", "how it works", "process", "flow" → "howItWorks" array
   - "market", "opportunity", "TAM", "market size" → "marketSize" and "marketDescription"
   - "traction", "metrics", "progress", "milestones", "numbers" → "traction" array
   - "revenue", "revenue model", "business model", "monetization", "pricing" → "businessModel"
   - "advantages", "moat", "competitive", "why us", "differentiators" → "competitiveEdge" array
   - "ask", "funding", "raise", "investment", "use of funds" → "askAmount" and "useOfFunds"
   - "vision", "future", "where we're going", "mission" → "vision"
   - "contact", "email", "website" → "contactEmail" and "contactWebsite"
   - "instagram", "linkedin", "twitter", "social", "social media", "links", "socials" → "socialLinks" array
   - "everything", "all", "the whole deck" → apply changes across ALL fields

3. **MAKE VISIBLE, MEANINGFUL CHANGES**: Every refinement must produce a noticeably different result. If the user says "simpler title", the tagline must be clearly shorter and simpler. If they say "add more detail to the solution", the solution text must be significantly expanded. Half-hearted tweaks (changing one word) are not acceptable.

4. **PRESERVE WHAT WORKS**: Only change what the user asked to change. If they say "fix the problem section", keep tagline, solution, traction, etc. exactly the same. Don't randomly rewrite fields the user didn't mention.

5. **ADD NEW CONTENT WHEN ASKED**: If the user asks to add something that doesn't exist in the current schema (e.g., team slide, testimonials), incorporate it into the closest matching field:
   - Team info → add to traction array or competitiveEdge
   - Testimonials/quotes → add to traction array
   - Social media links → add to socialLinks array
   - Specific URLs or links → add to socialLinks or contactWebsite

6. **HANDLE VAGUE REQUESTS PROACTIVELY**: If the user's feedback is vague ("make it better", "I don't like it"), improve the deck holistically:
   - Sharpen the tagline to be more specific and memorable
   - Make the problem more emotionally resonant
   - Make the solution more concrete with specific product details
   - Add specificity to traction points
   - Tighten all language — remove filler, passive voice, buzzwords

7. **TONE AND QUALITY STANDARDS**:
   - Write like a YC partner would expect: concise, data-driven, no fluff
   - Every sentence should earn its place — if it doesn't add information, cut it
   - Use concrete numbers over vague claims ("80% of dentists" not "many dentists")
   - Active voice over passive ("We reduce wait times by 40%" not "Wait times are reduced")
   - Avoid startup clichés: "disrupt", "leverage", "synergy", "revolutionary", "game-changing"

Return the COMPLETE updated JSON with changes applied. Every field must be present in the response, even unchanged ones.`,
      });
    } else {
      // ─── Initial generation mode ────────────────────────────
      messages.push({
        role: 'user',
        content: `${projectBrief}

Generate a pitch deck for this startup. Every field must be specific to what this company actually does — no generic filler. If information is missing, make reasonable inferences from the company name, description, and sectors, but never fabricate metrics the startup hasn't claimed.

Write like a top-tier YC partner would expect: concise, specific, data-grounded. Every sentence should earn its place. Avoid startup clichés (disrupt, leverage, synergy). Use active voice and concrete details.`,
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: currentDeck && feedback ? 0.6 : 0.5,
        response_format: { type: 'json_object' },
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
