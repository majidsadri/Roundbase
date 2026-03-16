export type PipelineStage =
  | 'researching'
  | 'reached_out'
  | 'meeting'
  | 'pitch'
  | 'term_sheet'
  | 'closed'
  | 'passed';

export interface Investor {
  id: string;
  name: string;
  firm: string;
  role: string;
  email: string;
  linkedin: string;
  checkSize: string;
  stage: string;
  sectors: string[];
  location: string;
  introPath: string;
  notes: string;
  source: string;
  website: string;
  createdAt: string;
}

export interface ParsedInvestor {
  name: string;
  firm: string;
  role: string;
  introStrength: string;
  checkSize: string;
  checkRange: string;
  locations: string[];
  categories: string[];
  matchScore?: number;
  matchReasons?: string[];
}

export interface PipelineEntry {
  id: string;
  projectId: string;
  investorId: string;
  stage: PipelineStage;
  notes: string;
  lastContact: string;
  nextFollowup: string;
  meetingDate?: string;
  meetingNotes?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  pipelineId: string;
  type: 'email' | 'meeting' | 'call' | 'note' | 'linkedin';
  date: string;
  notes: string;
  subject?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  subject: string;
  body: string;
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'cold-intro',
    name: 'Cold Intro',
    description: 'First outreach to a new investor',
    icon: 'snowflake',
    subject: 'Quick intro — {{project_name}}',
    body: `Hi {{investor_name}},

I'm reaching out because {{firm}} invests in {{sectors}} at the {{stage}} stage — which is exactly where we are with {{project_name}}.

{{project_description}}

We're raising {{raise_amount}} and I'd love to share a quick overview. Would you have 15 minutes this week?

Best,
{{sender_name}}`,
  },
  {
    id: 'warm-intro',
    name: 'Warm Intro',
    description: 'Referred by a mutual connection',
    icon: 'handshake',
    subject: 'Introduction — {{project_name}}',
    body: `Hi {{investor_name}},

{{mutual_connection}} suggested I reach out to you given {{firm}}'s focus on {{sectors}}.

We're building {{project_name}} — {{project_description}}

We're currently raising our {{stage}} round ({{raise_amount}}) and I'd love to get your thoughts. Would you have time for a brief call?

Best,
{{sender_name}}`,
  },
  {
    id: 'follow-up',
    name: 'Follow Up',
    description: 'Nudge after no response',
    icon: 'reply',
    subject: 'Following up — {{project_name}}',
    body: `Hi {{investor_name}},

I wanted to follow up on my previous note about {{project_name}}. Since we last connected, we've made some great progress:

- [Update 1]
- [Update 2]
- [Update 3]

Would love to find a time to chat. Let me know what works for you.

Best,
{{sender_name}}`,
  },
  {
    id: 'meeting-confirm',
    name: 'Meeting Confirm',
    description: 'Confirm an upcoming meeting',
    icon: 'calendar-check',
    subject: 'Confirming our meeting — {{project_name}}',
    body: `Hi {{investor_name}},

Looking forward to our meeting on {{meeting_date}}. Just confirming the time works for you.

To give you a quick preview of what we'll cover:

{{project_name}} — {{project_description}}

We're raising our {{stage}} round ({{raise_amount}}) and would love to walk you through our progress and vision.

I'll have our deck and key materials ready to share. Let me know if there's anything specific you'd like me to prepare.

See you then!

Best,
{{sender_name}}`,
  },
  {
    id: 'post-meeting',
    name: 'Thank You',
    description: 'Follow up after a meeting',
    icon: 'heart-handshake',
    subject: 'Great chatting — {{project_name}}',
    body: `Hi {{investor_name}},

Thank you for taking the time to meet today. I really enjoyed our conversation about {{project_name}} and your perspective on the {{sectors}} space.

As discussed, I'm attaching our deck for your review. Happy to answer any follow-up questions or connect you with our team.

Looking forward to next steps.

Best,
{{sender_name}}`,
  },
];

export interface ProjectFile {
  name: string;
  type: string; // 'deck' | 'pitch' | 'onepager' | 'financials' | 'other'
  dataUrl: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  stage: string;
  deckUrl: string;
  raiseAmount: string;
  targetInvestors: string;
  sectors: string[];
  location: string;
  website: string;
  logoUrl: string;
  files: ProjectFile[];
  createdAt: string;
}

export const STAGE_LABELS: Record<PipelineStage, string> = {
  researching: 'Researching',
  reached_out: 'Reached Out',
  meeting: 'Meeting',
  pitch: 'Pitch',
  term_sheet: 'Term Sheet',
  closed: 'Closed',
  passed: 'Passed',
};

export const STAGE_COLORS: Record<PipelineStage, string> = {
  researching: 'bg-gray-100 text-gray-600',
  reached_out: 'bg-gray-200 text-gray-700',
  meeting: 'bg-gray-300 text-gray-800',
  pitch: 'bg-gray-800 text-white',
  term_sheet: 'bg-gray-900 text-white',
  closed: 'bg-black text-white',
  passed: 'bg-gray-100 text-gray-400 line-through',
};
