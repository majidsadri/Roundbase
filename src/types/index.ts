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

export type CommitStatus = '' | 'interested' | 'verbal' | 'soft_circle' | 'committed' | 'wired';

export const COMMIT_STATUS_LABELS: Record<CommitStatus, string> = {
  '': 'None',
  interested: 'Interested',
  verbal: 'Verbal',
  soft_circle: 'Soft Circle',
  committed: 'Committed',
  wired: 'Wired',
};

export const COMMIT_STATUS_COLORS: Record<CommitStatus, string> = {
  '': 'bg-gray-100 text-gray-400',
  interested: 'bg-amber-50 text-amber-700',
  verbal: 'bg-blue-50 text-blue-700',
  soft_circle: 'bg-purple-50 text-purple-700',
  committed: 'bg-green-50 text-green-700',
  wired: 'bg-green-100 text-green-800',
};

export interface FeedbackEntry {
  id: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'concern';
  text: string;
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
  commitAmount?: string;
  commitStatus?: CommitStatus;
  feedback?: string; // JSON string of FeedbackEntry[]
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
    description: 'AI-personalized first outreach',
    icon: 'snowflake',
    subject: '{{project_name}} — {{stage}} in {{sectors}}',
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
    subject: 'Intro via {{mutual_connection}} — {{project_name}}',
    body: `Hi {{investor_name}},

{{mutual_connection}} suggested I reach out — they thought {{project_name}} would be a strong fit given {{firm}}'s focus on {{sectors}}.

{{project_description}}

We're raising our {{stage}} round ({{raise_amount}}) and I'd love to get your take. Would you have time for a brief call this week?

Best,
{{sender_name}}`,
  },
  {
    id: 'thesis-fit',
    name: 'Thesis Fit',
    description: 'They backed a competitor or adjacent co',
    icon: 'reply',
    subject: 'Building on the {{sectors}} thesis — {{project_name}}',
    body: `Hi {{investor_name}},

I noticed {{firm}} has conviction in the {{sectors}} space — which is exactly where we're building.

{{project_name}} — {{project_description}}

We're raising {{raise_amount}} at the {{stage}} stage. I think the portfolio synergies could be interesting — would you be open to a 15-min call?

Best,
{{sender_name}}`,
  },
  {
    id: 'follow-up',
    name: 'Follow Up',
    description: 'Nudge with new traction',
    icon: 'calendar-check',
    subject: 'Quick update — {{project_name}}',
    body: `Hi {{investor_name}},

Wanted to circle back on {{project_name}} with a few updates since my last note:

- [Update 1]
- [Update 2]
- [Update 3]

We're making real progress and the round is coming together. Would love to find 15 minutes to walk you through where we are.

Best,
{{sender_name}}`,
  },
  {
    id: 'post-meeting',
    name: 'Thank You',
    description: 'Follow up after a meeting',
    icon: 'heart-handshake',
    subject: 'Great chatting — {{project_name}} next steps',
    body: `Hi {{investor_name}},

Thank you for the time today. I really enjoyed our conversation about {{project_name}} and your perspective on the {{sectors}} space.

As discussed, I'm sharing our deck for your review. Happy to answer any follow-up questions or connect you with our team.

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
