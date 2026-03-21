'use client';

import { useState, useRef, useEffect, useCallback, TouchEvent as ReactTouchEvent } from 'react';
import {
  FileText, Sparkles, Loader2, Download, RefreshCw, Presentation,
  Target, Lightbulb, TrendingUp, DollarSign, Shield,
  Rocket, ChevronRight, ChevronLeft, Globe, Zap, BarChart3,
  Send, MessageSquare, Palette, Check, Save, X,
  ArrowRight, Maximize2, Minimize2,
  Instagram, Linkedin, Twitter, Facebook, Youtube, Link,
} from 'lucide-react';
import { Project } from '@/types';

interface DeckData {
  tagline: string;
  problemTitle: string;
  problem: string;
  solutionTitle: string;
  solution: string;
  howItWorks: string[];
  marketSize: string;
  marketDescription: string;
  traction: string[];
  businessModel: string;
  competitiveEdge: string[];
  askAmount: string;
  useOfFunds: { category: string; percentage: number }[];
  vision: string;
  contactEmail: string;
  contactWebsite: string;
  socialLinks?: { platform: string; url: string }[];
}

interface Comment {
  id: number;
  text: string;
  type: 'user' | 'system';
  timestamp: Date;
}

// ─── Theme definitions ──────────────────────────────────────
const THEMES = {
  noir: {
    name: 'Noir',
    label: 'Pure Black & Gold',
    swatch: 'bg-gradient-to-br from-black via-zinc-900 to-black',
    page1Bg: 'bg-gradient-to-br from-black via-zinc-900 to-black',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.05] border border-white/[0.08]',
    cardTitle: 'text-amber-400/70',
    cardText: 'text-white/80',
    accentIcon1: 'bg-amber-500/15',
    accentIcon1Text: 'text-amber-400',
    accentIcon2: 'bg-amber-500/10',
    accentIcon2Text: 'text-amber-300',
    accentIcon3: 'bg-white/[0.08]',
    accentIcon3Text: 'text-white/70',
    stepNumBg: 'bg-amber-500/20 text-amber-400',
    page2Bg: 'bg-zinc-50',
    statBg: 'bg-white border border-zinc-200',
    sectionCardBg: 'bg-white border border-zinc-100',
    sectionIconBg: 'bg-zinc-900',
    sectionIconText: 'text-amber-400',
    sectionTitle: 'text-zinc-400',
    sectionText: 'text-zinc-700',
    dotColor: 'bg-zinc-900',
    ctaBg: 'bg-gradient-to-br from-black via-zinc-900 to-black',
    fundColors: ['bg-zinc-900', 'bg-amber-600', 'bg-zinc-500', 'bg-amber-300'],
    fundColorHex: ['#18181b', '#d97706', '#71717a', '#fcd34d'],
    previewDot: 'bg-zinc-900',
    badgeBg: 'bg-amber-500/15 text-amber-300',
    footerBg: 'bg-black',
    footerText: 'text-white/20',
    footer2Bg: 'bg-zinc-50 border-t border-zinc-100',
    footer2Text: 'text-zinc-300',
    pdfPage1: 'background: linear-gradient(135deg, #000 0%, #18181b 50%, #09090b 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);',
    pdfPage2: 'background: #fafafa; color: #18181b;',
    pdfStatBg: 'background: #ffffff; border: 1px solid #e4e4e7;',
    pdfCtaBg: 'background: linear-gradient(135deg, #000 0%, #18181b 100%); color: white;',
  },
  sapphire: {
    name: 'Sapphire',
    label: 'Deep Blue & Luxe',
    swatch: 'bg-gradient-to-br from-blue-950 via-indigo-900 to-violet-950',
    page1Bg: 'bg-gradient-to-br from-blue-950 via-indigo-900 to-violet-950',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.07] border border-white/[0.08]',
    cardTitle: 'text-sky-300/60',
    cardText: 'text-white/85',
    accentIcon1: 'bg-sky-400/20',
    accentIcon1Text: 'text-sky-300',
    accentIcon2: 'bg-violet-400/20',
    accentIcon2Text: 'text-violet-300',
    accentIcon3: 'bg-cyan-400/20',
    accentIcon3Text: 'text-cyan-300',
    stepNumBg: 'bg-sky-400/20 text-sky-300',
    page2Bg: 'bg-slate-50',
    statBg: 'bg-white border border-blue-100',
    sectionCardBg: 'bg-white border border-blue-50',
    sectionIconBg: 'bg-indigo-900',
    sectionIconText: 'text-sky-300',
    sectionTitle: 'text-indigo-400',
    sectionText: 'text-slate-700',
    dotColor: 'bg-indigo-800',
    ctaBg: 'bg-gradient-to-br from-blue-950 via-indigo-900 to-violet-950',
    fundColors: ['bg-indigo-900', 'bg-sky-500', 'bg-violet-500', 'bg-cyan-400'],
    fundColorHex: ['#312e81', '#0ea5e9', '#8b5cf6', '#22d3ee'],
    previewDot: 'bg-indigo-800',
    badgeBg: 'bg-sky-400/15 text-sky-200',
    footerBg: 'bg-blue-950',
    footerText: 'text-blue-200/20',
    footer2Bg: 'bg-slate-50 border-t border-blue-100',
    footer2Text: 'text-indigo-300',
    pdfPage1: 'background: linear-gradient(135deg, #172554 0%, #312e81 50%, #2e1065 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);',
    pdfPage2: 'background: #f8fafc; color: #1e293b;',
    pdfStatBg: 'background: #ffffff; border: 1px solid #dbeafe;',
    pdfCtaBg: 'background: linear-gradient(135deg, #172554 0%, #312e81 100%); color: white;',
  },
  dusk: {
    name: 'Dusk',
    label: 'Violet & Modern',
    swatch: 'bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950',
    page1Bg: 'bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.07] border border-white/[0.08]',
    cardTitle: 'text-purple-300/60',
    cardText: 'text-white/85',
    accentIcon1: 'bg-fuchsia-400/20',
    accentIcon1Text: 'text-fuchsia-300',
    accentIcon2: 'bg-violet-400/20',
    accentIcon2Text: 'text-violet-300',
    accentIcon3: 'bg-pink-400/20',
    accentIcon3Text: 'text-pink-300',
    stepNumBg: 'bg-fuchsia-400/20 text-fuchsia-300',
    page2Bg: 'bg-white',
    statBg: 'bg-violet-50 border border-violet-100',
    sectionCardBg: 'bg-violet-50/50 border border-violet-100/50',
    sectionIconBg: 'bg-purple-900',
    sectionIconText: 'text-fuchsia-300',
    sectionTitle: 'text-purple-400',
    sectionText: 'text-gray-700',
    dotColor: 'bg-purple-800',
    ctaBg: 'bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950',
    fundColors: ['bg-purple-900', 'bg-fuchsia-500', 'bg-violet-400', 'bg-pink-400'],
    fundColorHex: ['#581c87', '#d946ef', '#a78bfa', '#f472b6'],
    previewDot: 'bg-purple-700',
    badgeBg: 'bg-fuchsia-400/15 text-fuchsia-200',
    footerBg: 'bg-violet-950',
    footerText: 'text-purple-200/20',
    footer2Bg: 'bg-violet-50 border-t border-violet-100',
    footer2Text: 'text-purple-300',
    pdfPage1: 'background: linear-gradient(135deg, #2e1065 0%, #581c87 50%, #4a044e 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);',
    pdfPage2: 'background: #ffffff; color: #111;',
    pdfStatBg: 'background: #f5f3ff; border: 1px solid #ede9fe;',
    pdfCtaBg: 'background: linear-gradient(135deg, #2e1065 0%, #581c87 100%); color: white;',
  },
  forest: {
    name: 'Forest',
    label: 'Deep Green & Warm',
    swatch: 'bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950',
    page1Bg: 'bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.07] border border-white/[0.08]',
    cardTitle: 'text-emerald-300/60',
    cardText: 'text-white/85',
    accentIcon1: 'bg-amber-400/20',
    accentIcon1Text: 'text-amber-300',
    accentIcon2: 'bg-emerald-400/20',
    accentIcon2Text: 'text-emerald-300',
    accentIcon3: 'bg-teal-400/20',
    accentIcon3Text: 'text-teal-300',
    stepNumBg: 'bg-emerald-400/20 text-emerald-300',
    page2Bg: 'bg-stone-50',
    statBg: 'bg-white border border-emerald-100',
    sectionCardBg: 'bg-white border border-emerald-50',
    sectionIconBg: 'bg-green-900',
    sectionIconText: 'text-emerald-300',
    sectionTitle: 'text-emerald-500',
    sectionText: 'text-stone-700',
    dotColor: 'bg-green-800',
    ctaBg: 'bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950',
    fundColors: ['bg-green-900', 'bg-emerald-500', 'bg-teal-500', 'bg-amber-400'],
    fundColorHex: ['#14532d', '#10b981', '#14b8a6', '#fbbf24'],
    previewDot: 'bg-green-800',
    badgeBg: 'bg-emerald-400/15 text-emerald-200',
    footerBg: 'bg-emerald-950',
    footerText: 'text-emerald-200/20',
    footer2Bg: 'bg-stone-50 border-t border-emerald-100',
    footer2Text: 'text-emerald-300',
    pdfPage1: 'background: linear-gradient(135deg, #022c22 0%, #14532d 50%, #042f2e 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);',
    pdfPage2: 'background: #fafaf9; color: #1c1917;',
    pdfStatBg: 'background: #ffffff; border: 1px solid #d1fae5;',
    pdfCtaBg: 'background: linear-gradient(135deg, #022c22 0%, #14532d 100%); color: white;',
  },
  ember: {
    name: 'Ember',
    label: 'Warm Red & Bold',
    swatch: 'bg-gradient-to-br from-rose-950 via-red-900 to-orange-950',
    page1Bg: 'bg-gradient-to-br from-rose-950 via-red-900 to-orange-950',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.07] border border-white/[0.08]',
    cardTitle: 'text-rose-300/60',
    cardText: 'text-white/85',
    accentIcon1: 'bg-orange-400/20',
    accentIcon1Text: 'text-orange-300',
    accentIcon2: 'bg-rose-400/20',
    accentIcon2Text: 'text-rose-300',
    accentIcon3: 'bg-amber-400/20',
    accentIcon3Text: 'text-amber-300',
    stepNumBg: 'bg-rose-400/20 text-rose-300',
    page2Bg: 'bg-white',
    statBg: 'bg-rose-50 border border-rose-100',
    sectionCardBg: 'bg-white border border-rose-50',
    sectionIconBg: 'bg-red-900',
    sectionIconText: 'text-rose-300',
    sectionTitle: 'text-rose-400',
    sectionText: 'text-gray-700',
    dotColor: 'bg-red-800',
    ctaBg: 'bg-gradient-to-br from-rose-950 via-red-900 to-orange-950',
    fundColors: ['bg-red-900', 'bg-rose-500', 'bg-orange-500', 'bg-amber-400'],
    fundColorHex: ['#7f1d1d', '#f43f5e', '#f97316', '#fbbf24'],
    previewDot: 'bg-red-700',
    badgeBg: 'bg-rose-400/15 text-rose-200',
    footerBg: 'bg-rose-950',
    footerText: 'text-rose-200/20',
    footer2Bg: 'bg-rose-50 border-t border-rose-100',
    footer2Text: 'text-rose-300',
    pdfPage1: 'background: linear-gradient(135deg, #4c0519 0%, #7f1d1d 50%, #431407 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);',
    pdfPage2: 'background: #ffffff; color: #111;',
    pdfStatBg: 'background: #fff1f2; border: 1px solid #fecdd3;',
    pdfCtaBg: 'background: linear-gradient(135deg, #4c0519 0%, #7f1d1d 100%); color: white;',
  },
  ivory: {
    name: 'Ivory',
    label: 'Light & Elegant',
    swatch: 'bg-gradient-to-br from-stone-100 via-amber-50 to-orange-50',
    page1Bg: 'bg-gradient-to-br from-stone-50 via-amber-50/50 to-orange-50/30',
    page1Text: 'text-stone-900',
    cardBg: 'bg-white border border-stone-200',
    cardTitle: 'text-stone-400',
    cardText: 'text-stone-700',
    accentIcon1: 'bg-rose-100',
    accentIcon1Text: 'text-rose-600',
    accentIcon2: 'bg-amber-100',
    accentIcon2Text: 'text-amber-700',
    accentIcon3: 'bg-sky-100',
    accentIcon3Text: 'text-sky-600',
    stepNumBg: 'bg-stone-800 text-white',
    page2Bg: 'bg-white',
    statBg: 'bg-stone-50 border border-stone-200',
    sectionCardBg: 'bg-stone-50/50 border border-stone-200',
    sectionIconBg: 'bg-stone-800',
    sectionIconText: 'text-amber-200',
    sectionTitle: 'text-stone-400',
    sectionText: 'text-stone-700',
    dotColor: 'bg-stone-800',
    ctaBg: 'bg-stone-800',
    fundColors: ['bg-stone-800', 'bg-amber-600', 'bg-stone-400', 'bg-amber-300'],
    fundColorHex: ['#292524', '#d97706', '#a8a29e', '#fcd34d'],
    previewDot: 'bg-stone-400',
    badgeBg: 'bg-stone-200/60 text-stone-600',
    footerBg: 'bg-stone-100',
    footerText: 'text-stone-300',
    footer2Bg: 'bg-white border-t border-stone-100',
    footer2Text: 'text-stone-300',
    pdfPage1: 'background: linear-gradient(135deg, #fafaf9 0%, #fffbeb 50%, #fff7ed 100%); color: #1c1917;',
    pdfCardBg: 'background: #ffffff; border: 1px solid #d6d3d1;',
    pdfPage2: 'background: #ffffff; color: #1c1917;',
    pdfStatBg: 'background: #fafaf9; border: 1px solid #d6d3d1;',
    pdfCtaBg: 'background: #292524; color: white;',
  },
  slate: {
    name: 'Slate',
    label: 'Corporate & Clean',
    swatch: 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800',
    page1Bg: 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.07] border border-white/[0.08]',
    cardTitle: 'text-slate-300/60',
    cardText: 'text-white/85',
    accentIcon1: 'bg-sky-400/20',
    accentIcon1Text: 'text-sky-300',
    accentIcon2: 'bg-slate-300/20',
    accentIcon2Text: 'text-slate-300',
    accentIcon3: 'bg-teal-400/20',
    accentIcon3Text: 'text-teal-300',
    stepNumBg: 'bg-sky-400/20 text-sky-300',
    page2Bg: 'bg-white',
    statBg: 'bg-slate-50 border border-slate-200',
    sectionCardBg: 'bg-white border border-slate-100',
    sectionIconBg: 'bg-slate-700',
    sectionIconText: 'text-sky-300',
    sectionTitle: 'text-slate-400',
    sectionText: 'text-slate-700',
    dotColor: 'bg-slate-700',
    ctaBg: 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800',
    fundColors: ['bg-slate-700', 'bg-sky-500', 'bg-slate-400', 'bg-teal-400'],
    fundColorHex: ['#334155', '#0ea5e9', '#94a3b8', '#2dd4bf'],
    previewDot: 'bg-slate-600',
    badgeBg: 'bg-sky-400/15 text-sky-200',
    footerBg: 'bg-slate-800',
    footerText: 'text-slate-400/30',
    footer2Bg: 'bg-slate-50 border-t border-slate-100',
    footer2Text: 'text-slate-300',
    pdfPage1: 'background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);',
    pdfPage2: 'background: #ffffff; color: #1e293b;',
    pdfStatBg: 'background: #f8fafc; border: 1px solid #e2e8f0;',
    pdfCtaBg: 'background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white;',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

const LOADING_STEPS = [
  { label: 'Reading project brief', detail: 'Stage, sectors, traction' },
  { label: 'Researching market angles', detail: 'TAM, positioning, competitors' },
  { label: 'Writing slide content', detail: 'Tagline, problem, solution' },
  { label: 'Designing layout', detail: 'Theme, typography, data viz' },
  { label: 'Final polish', detail: 'Copy, flow, consistency' },
];

const LOADING_TIPS = [
  'VCs spend an average of 3 minutes and 44 seconds on a pitch deck.',
  'The best decks tell a story — problem, insight, solution, proof.',
  'Leading with traction data increases response rates by 2x.',
  'Keep your ask slide specific — exact amount, use of funds, timeline.',
  'Personalized outreach gets 3x more responses than generic blasts.',
];

// ─── Mini Preview Component ─────────────────────────────────
function ThemePreview({ theme, projectName }: { theme: ThemeKey; projectName: string }) {
  const t = THEMES[theme];
  const isDark = theme !== 'ivory';
  return (
    <div className={`w-full aspect-[4/3] ${t.swatch} rounded-lg overflow-hidden relative`}>
      <div className="absolute inset-0 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className={`text-[8px] font-bold ${isDark ? 'text-white/90' : 'text-gray-900'} tracking-tight`}>{projectName}</div>
          <div className={`px-1.5 py-0.5 rounded-full ${isDark ? 'bg-white/15' : 'bg-gray-100'}`}>
            <span className={`text-[6px] ${isDark ? 'text-white/60' : 'text-gray-400'}`}>Pre-Seed</span>
          </div>
        </div>
        <div className={`text-[10px] font-extrabold leading-tight mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your AI-crafted headline goes here
        </div>
        <div className={`text-[6px] mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          AI-generated description preview
        </div>
        <div className="flex gap-1.5 flex-1">
          <div className={`flex-1 rounded-md ${isDark ? 'bg-white/[0.06] border border-white/10' : 'bg-gray-50 border border-gray-200'} p-2`}>
            <div className={`w-6 h-1 rounded-full mb-1 ${isDark ? 'bg-white/20' : 'bg-gray-200'}`} />
            <div className={`w-full h-0.5 rounded-full mb-0.5 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
            <div className={`w-3/4 h-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
          </div>
          <div className={`flex-1 rounded-md ${isDark ? 'bg-white/[0.06] border border-white/10' : 'bg-gray-50 border border-gray-200'} p-2`}>
            <div className={`w-6 h-1 rounded-full mb-1 ${isDark ? 'bg-white/20' : 'bg-gray-200'}`} />
            <div className={`w-full h-0.5 rounded-full mb-0.5 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
            <div className={`w-2/3 h-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ───────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 mr-4 bg-white border border-gray-100 rounded-xl">
      {[0, 150, 300].map(delay => (
        <div
          key={delay}
          className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
          style={{ animation: `typingDot 1s ease-in-out infinite`, animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export default function PitchDeckSection({ project, onFileSaved }: { project: Project; onFileSaved?: () => void }) {
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<ThemeKey>('noir');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingTip, setLoadingTip] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [fullscreen, setFullscreen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showMobileThemeSheet, setShowMobileThemeSheet] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);
  const themePickerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const t = THEMES[theme];
  const TOTAL_SLIDES = 2;

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: ReactTouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Only trigger if horizontal swipe > 50px, faster than 300ms, and more horizontal than vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 300) {
      if (dx < 0 && currentSlide < TOTAL_SLIDES - 1) {
        setSlideDirection('right');
        setCurrentSlide(prev => prev + 1);
      } else if (dx > 0 && currentSlide > 0) {
        setSlideDirection('left');
        setCurrentSlide(prev => prev - 1);
      }
    }
  }, [currentSlide]);

  // Close theme picker on outside click (desktop only)
  useEffect(() => {
    if (!showThemePicker) return;
    const handler = (e: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target as Node)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showThemePicker]);

  // Keyboard navigation for slides
  useEffect(() => {
    if (!deck) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlide < TOTAL_SLIDES - 1) {
        setSlideDirection('right');
        setCurrentSlide(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setSlideDirection('left');
        setCurrentSlide(prev => prev - 1);
      } else if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deck, currentSlide, fullscreen]);

  // Animate loading steps with varied timing
  useEffect(() => {
    if (!loading || deck) return;
    setLoadingStep(0);
    const delays = [1800, 2500, 3000, 2200, 2000];
    let step = 0;
    const advance = () => {
      if (step < LOADING_STEPS.length - 1) {
        step++;
        setLoadingStep(step);
        setTimeout(advance, delays[step] || 2000);
      }
    };
    const timer = setTimeout(advance, delays[0]);
    return () => clearTimeout(timer);
  }, [loading, deck]);

  // Rotate tips during loading
  useEffect(() => {
    if (!loading || deck) return;
    setLoadingTip(Math.floor(Math.random() * LOADING_TIPS.length));
    const interval = setInterval(() => {
      setLoadingTip(prev => (prev + 1) % LOADING_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, deck]);

  const goToSlide = useCallback((idx: number) => {
    setSlideDirection(idx > currentSlide ? 'right' : 'left');
    setCurrentSlide(idx);
  }, [currentSlide]);

  const generateDeck = async (feedback?: string) => {
    const isRefine = !!feedback && !!deck;
    if (isRefine) setRefining(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          feedback: feedback || undefined,
          currentDeck: feedback ? deck : undefined,
          theme: THEMES[theme].label,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDeck(data.deck);
        setCurrentSlide(0);
        if (isRefine) {
          setComments(prev => [...prev, {
            id: Date.now() + 1,
            text: 'Done! I\'ve updated the deck based on your feedback.',
            type: 'system',
            timestamp: new Date(),
          }]);
        }
      }
    } catch {
      setError('Failed to generate pitch deck. Please try again.');
    }
    setLoading(false);
    setRefining(false);
  };

  const handleSendComment = () => {
    const text = commentInput.trim();
    if (!text || refining) return;
    setComments(prev => [...prev, { id: Date.now(), text, type: 'user', timestamp: new Date() }]);
    setCommentInput('');
    generateDeck(text);
    setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDownloadPDF = () => {
    if (!deck) return;
    const html = buildDeckHTML();
    // Create blob and open in new tab for printing (avoids popup blocker)
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      // Fallback: download as HTML file
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}-Pitch-Deck.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
      return;
    }
    // Wait for page to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => printWindow.print(), 300);
    };
    // Cleanup blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const buildDeckHTML = () => {
    if (!deck) return '';
    const th = THEMES[theme];
    return `<!DOCTYPE html><html><head><title>${project.name} - Pitch Deck</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',-apple-system,sans-serif;color:#111}.page{width:1024px;min-height:768px;padding:64px;page-break-after:always;position:relative;overflow:hidden;margin:0 auto}.page-1{${th.pdfPage1}display:flex;flex-direction:column}.page-1 .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:48px}.page-1 .logo-name{font-size:28px;font-weight:800;letter-spacing:-0.5px}.page-1 .stage-badge{background:rgba(255,255,255,0.15);padding:6px 16px;border-radius:20px;font-size:13px;font-weight:500}.page-1 .tagline{font-size:42px;font-weight:800;line-height:1.15;margin-bottom:16px;letter-spacing:-1px;max-width:700px}.page-1 .desc{font-size:18px;opacity:0.7;margin-bottom:48px;max-width:600px;line-height:1.6}.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:24px;flex:1}.card{${th.pdfCardBg}border-radius:16px;padding:28px}.card-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:12px;opacity:0.6}.card-text{font-size:15px;line-height:1.65}.card-dark{${th.pdfStatBg}border-radius:16px;padding:28px;color:#111}.card-dark .card-title{color:#666}.steps{list-style:none;padding:0}.steps li{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;font-size:14px;line-height:1.5}.step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;background:rgba(255,255,255,0.2)}.page-2{${th.pdfPage2}}.page-2-header{display:flex;align-items:center;gap:12px;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #f0f0f0}.page-2-header .logo-name{font-size:20px;font-weight:700}.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:32px}.stat-card{text-align:center;padding:24px 16px;${th.pdfStatBg}border-radius:12px}.stat-value{font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px}.stat-label{font-size:12px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}.traction-dot{width:6px;height:6px;border-radius:50%;background:${th.fundColorHex[0]};flex-shrink:0;margin-top:6px}.traction-item{display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px}.edge-check{width:20px;height:20px;background:${th.fundColorHex[0]};color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}.edge-item{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px}.fund-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:12px 0}.fund-bar div{height:100%}.fund-legend{display:flex;flex-wrap:wrap;gap:16px;margin-top:8px}.fund-item{display:flex;align-items:center;gap:6px;font-size:12px}.fund-dot{width:8px;height:8px;border-radius:2px}.cta-bar{margin-top:32px;padding:28px 32px;${th.pdfCtaBg}border-radius:16px;display:flex;align-items:center;justify-content:space-between}.cta-bar .vision{font-size:16px;font-weight:600;max-width:500px;line-height:1.5}.cta-bar .contact{text-align:right;font-size:13px;opacity:0.8}@media print{.page{page-break-after:always}}</style></head><body>
<div class="page page-1"><div class="header"><div class="logo-name">${project.name}</div><div class="stage-badge">${project.stage}${project.location ? ' &middot; ' + project.location : ''}</div></div><div class="tagline">${deck.tagline}</div><div class="desc">${project.description}</div><div class="grid-2"><div class="card"><div class="card-title">${deck.problemTitle || 'The Problem'}</div><div class="card-text">${deck.problem}</div></div><div class="card"><div class="card-title">${deck.solutionTitle || 'The Solution'}</div><div class="card-text">${deck.solution}</div></div><div class="card" style="grid-column:span 2"><div class="card-title">How It Works</div><ol class="steps">${(deck.howItWorks || []).map((s: string, i: number) => `<li><div class="step-num">${i + 1}</div><span>${s}</span></li>`).join('')}</ol></div></div></div>
<div class="page page-2"><div class="page-2-header"><div class="logo-name">${project.name}</div></div><div class="grid-3"><div class="stat-card"><div class="stat-value">${deck.marketSize || 'TBD'}</div><div class="stat-label">Market Size (TAM)</div></div><div class="stat-card"><div class="stat-value">${deck.askAmount || project.raiseAmount || 'TBD'}</div><div class="stat-label">Raising</div></div><div class="stat-card"><div class="stat-value">${project.stage}</div><div class="stat-label">Stage</div></div></div><div class="grid-2"><div class="card-dark"><div class="card-title">Traction & Milestones</div>${(deck.traction || []).map((t: string) => `<div class="traction-item"><div class="traction-dot"></div>${t}</div>`).join('')}</div><div class="card-dark"><div class="card-title">Competitive Advantages</div>${(deck.competitiveEdge || []).map((e: string) => `<div class="edge-item"><div class="edge-check">&#10003;</div>${e}</div>`).join('')}</div><div class="card-dark"><div class="card-title">Business Model</div><div class="card-text">${deck.businessModel}</div></div><div class="card-dark"><div class="card-title">Use of Funds</div><div class="fund-bar">${(deck.useOfFunds || []).map((f: { percentage: number }, i: number) => `<div style="width:${f.percentage}%;background:${th.fundColorHex[i] || '#ddd'}"></div>`).join('')}</div><div class="fund-legend">${(deck.useOfFunds || []).map((f: { category: string; percentage: number }, i: number) => `<div class="fund-item"><div class="fund-dot" style="background:${th.fundColorHex[i] || '#ddd'}"></div>${f.category} (${f.percentage}%)</div>`).join('')}</div></div></div><div class="cta-bar"><div class="vision">${deck.vision}</div><div class="contact">${deck.contactWebsite ? '<div>' + deck.contactWebsite + '</div>' : ''}${deck.contactEmail ? '<div>' + deck.contactEmail + '</div>' : ''}</div></div></div>
</body></html>`;
  };

  const handleSaveToFiles = async () => {
    if (!deck) return;
    setSaving(true);
    setSaved(false);
    try {
      const htmlContent = buildDeckHTML();
      const res = await fetch('/api/generate-deck/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, htmlContent, fileName: `${project.name}-Pitch-Deck` }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setSaved(true); onFileSaved?.(); setTimeout(() => setSaved(false), 3000); }
    } catch { setError('Failed to save pitch deck to files.'); }
    setSaving(false);
  };

  // ─── Slide Content Renderers ───────────────────────────────
  const renderSlide1 = (isFullscreen = false) => (
    <div className={`rounded-xl overflow-hidden ${isFullscreen ? '' : 'border border-gray-200'}`} style={isFullscreen ? undefined : { boxShadow: 'var(--shadow-elevated)' }}>
      <div className={`${t.page1Bg} ${t.page1Text} p-5 sm:p-8`}>
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {project.logoUrl ? (
              <img src={project.logoUrl} alt={project.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain bg-white/10 p-0.5" />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold">{project.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}</span>
              </div>
            )}
            <span className="text-base sm:text-lg font-bold tracking-tight truncate">{project.name}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`px-2.5 py-1 ${t.badgeBg} rounded-full text-[11px] font-medium`}>{project.stage}</span>
            {project.location && <span className={`px-2.5 py-1 ${t.badgeBg} rounded-full text-[11px] font-medium hidden sm:inline`}>{project.location}</span>}
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-3 max-w-2xl">{deck!.tagline}</h1>
        <p className="text-sm sm:text-base opacity-60 max-w-xl leading-relaxed">{project.description}</p>
      </div>
      <div className={`${t.page1Bg} ${t.page1Text} px-5 sm:px-8 pb-5 sm:pb-8`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className={`${t.cardBg} rounded-2xl p-4 sm:p-6 relative group/card hover:ring-2 hover:ring-indigo-400/30 hover:ring-offset-2 hover:ring-offset-transparent transition-all cursor-default`}>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 ${t.accentIcon1} rounded-lg flex items-center justify-center`}>
                <Target size={12} className={t.accentIcon1Text} />
              </div>
              <span className={`text-[10px] sm:text-[11px] uppercase tracking-widest ${t.cardTitle} font-semibold`}>{deck!.problemTitle || 'The Problem'}</span>
            </div>
            <p className={`text-xs sm:text-sm ${t.cardText} leading-relaxed`}>{deck!.problem}</p>
          </div>
          <div className={`${t.cardBg} rounded-2xl p-4 sm:p-6 relative group/card hover:ring-2 hover:ring-indigo-400/30 hover:ring-offset-2 hover:ring-offset-transparent transition-all cursor-default`}>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 ${t.accentIcon2} rounded-lg flex items-center justify-center`}>
                <Lightbulb size={12} className={t.accentIcon2Text} />
              </div>
              <span className={`text-[10px] sm:text-[11px] uppercase tracking-widest ${t.cardTitle} font-semibold`}>{deck!.solutionTitle || 'The Solution'}</span>
            </div>
            <p className={`text-xs sm:text-sm ${t.cardText} leading-relaxed`}>{deck!.solution}</p>
          </div>
        </div>
        <div className={`${t.cardBg} rounded-2xl p-4 sm:p-6 relative group/card hover:ring-2 hover:ring-indigo-400/30 hover:ring-offset-2 hover:ring-offset-transparent transition-all cursor-default`}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 ${t.accentIcon3} rounded-lg flex items-center justify-center`}>
              <Zap size={12} className={t.accentIcon3Text} />
            </div>
            <span className={`text-[10px] sm:text-[11px] uppercase tracking-widest ${t.cardTitle} font-semibold`}>How It Works</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {(deck!.howItWorks || []).map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-6 h-6 ${t.stepNumBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-[11px] font-bold">{i + 1}</span>
                </div>
                <p className="text-xs sm:text-sm opacity-70 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSlide2 = (isFullscreen = false) => (
    <div className={`rounded-xl overflow-hidden ${isFullscreen ? '' : 'border border-gray-200'} ${t.page2Bg}`} style={isFullscreen ? undefined : { boxShadow: 'var(--shadow-elevated)' }}>
      <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-3 sm:pb-4 border-b border-gray-100 flex items-center gap-2.5">
        {project.logoUrl ? (
          <img src={project.logoUrl} alt={project.name} className="w-7 h-7 rounded-lg object-contain border border-gray-100 p-0.5" />
        ) : (
          <div className={`w-7 h-7 rounded-lg ${t.sectionIconBg} flex items-center justify-center`}>
            <span className={`text-[10px] font-bold ${t.sectionIconText}`}>{project.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}</span>
          </div>
        )}
        <span className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">{project.name}</span>
      </div>
      <div className="p-5 sm:p-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-6">
          {[
            { value: deck!.marketSize || 'TBD', label: 'TAM' },
            { value: deck!.askAmount || project.raiseAmount || 'TBD', label: 'Raising' },
            { value: project.stage, label: 'Stage' },
          ].map((stat, i) => (
            <div key={i} className={`text-center p-3 sm:p-5 ${t.statBg} rounded-xl sm:rounded-2xl`}>
              <div className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight">{stat.value}</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-wide mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className={`${t.sectionCardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:ring-2 hover:ring-indigo-400/30 hover:ring-offset-2 transition-all cursor-default`}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className={`w-6 h-6 ${t.sectionIconBg} rounded-lg flex items-center justify-center`}><TrendingUp size={12} className={t.sectionIconText} /></div>
              <span className={`text-[10px] sm:text-[11px] uppercase tracking-widest ${t.sectionTitle} font-semibold`}>Traction</span>
            </div>
            <div className="space-y-2.5">
              {(deck!.traction || []).map((tr, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 ${t.dotColor} rounded-full mt-1.5 flex-shrink-0`} />
                  <p className={`text-xs sm:text-sm ${t.sectionText} leading-relaxed`}>{tr}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`${t.sectionCardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:ring-2 hover:ring-indigo-400/30 hover:ring-offset-2 transition-all cursor-default`}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className={`w-6 h-6 ${t.sectionIconBg} rounded-lg flex items-center justify-center`}><Shield size={12} className={t.sectionIconText} /></div>
              <span className={`text-[10px] sm:text-[11px] uppercase tracking-widest ${t.sectionTitle} font-semibold`}>Advantages</span>
            </div>
            <div className="space-y-2.5">
              {(deck!.competitiveEdge || []).map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-4 h-4 ${t.sectionIconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}><ChevronRight size={10} className={t.sectionIconText} /></div>
                  <p className={`text-xs sm:text-sm ${t.sectionText} leading-relaxed`}>{e}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`${t.sectionCardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:ring-2 hover:ring-indigo-400/30 hover:ring-offset-2 transition-all cursor-default`}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className={`w-6 h-6 ${t.sectionIconBg} rounded-lg flex items-center justify-center`}><DollarSign size={12} className={t.sectionIconText} /></div>
              <span className={`text-[10px] sm:text-[11px] uppercase tracking-widest ${t.sectionTitle} font-semibold`}>Business Model</span>
            </div>
            <p className={`text-xs sm:text-sm ${t.sectionText} leading-relaxed`}>{deck!.businessModel}</p>
          </div>
          <div className={`${t.sectionCardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:ring-2 hover:ring-indigo-400/30 hover:ring-offset-2 transition-all cursor-default`}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className={`w-6 h-6 ${t.sectionIconBg} rounded-lg flex items-center justify-center`}><BarChart3 size={12} className={t.sectionIconText} /></div>
              <span className={`text-[10px] sm:text-[11px] uppercase tracking-widest ${t.sectionTitle} font-semibold`}>Use of Funds</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden mb-2.5">
              {(deck!.useOfFunds || []).map((f, i) => (
                <div key={i} className={`h-full ${t.fundColors[i] || 'bg-gray-300'}`} style={{ width: `${f.percentage}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(deck!.useOfFunds || []).map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-sm ${t.fundColors[i] || 'bg-gray-300'}`} />
                  <span className="text-[11px] text-gray-600">{f.category} <span className="text-gray-400">({f.percentage}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* CTA */}
        <div className={`${t.ctaBg} rounded-xl sm:rounded-2xl p-4 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white">
            <div className="flex items-start gap-2.5">
              <Rocket size={18} className="text-white/60 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">{deck!.vision}</p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              {deck!.contactWebsite && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/50 mb-0.5">
                  <Globe size={10} />{deck!.contactWebsite}
                </div>
              )}
              {deck!.socialLinks && deck!.socialLinks.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5 sm:justify-end">
                  {deck!.socialLinks.map((sl, i) => {
                    const platform = sl.platform.toLowerCase();
                    const Icon = platform.includes('instagram') ? Instagram
                      : platform.includes('linkedin') ? Linkedin
                      : platform.includes('twitter') || platform.includes('x.com') ? Twitter
                      : platform.includes('facebook') ? Facebook
                      : platform.includes('youtube') ? Youtube
                      : Link;
                    return (
                      <a key={i} href={sl.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 transition-colors">
                        <Icon size={11} />
                        <span className="hidden sm:inline">{sl.platform}</span>
                      </a>
                    );
                  })}
                </div>
              )}
              {(project.sectors || []).length > 0 && (
                <div className="flex flex-wrap gap-1 sm:justify-end mt-1.5">
                  {project.sectors.slice(0, 3).map(s => (
                    <span key={s} className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white/60">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Slide Navigation Component ────────────────────────────
  const SlideNav = ({ dark = false }: { dark?: boolean }) => (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button
        onClick={() => { setSlideDirection('left'); setCurrentSlide(0); }}
        disabled={currentSlide === 0}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-20 ${
          dark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
        }`}
        style={dark ? undefined : { boxShadow: 'var(--shadow-sm)' }}
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`rounded-full transition-all duration-200 ${
              i === currentSlide
                ? `w-6 h-2 ${dark ? 'bg-white' : 'bg-indigo-500'}`
                : `w-2 h-2 ${dark ? 'bg-white/30 hover:bg-white/50' : 'bg-gray-300 hover:bg-gray-400'}`
            }`}
          />
        ))}
      </div>
      <button
        onClick={() => { setSlideDirection('right'); setCurrentSlide(1); }}
        disabled={currentSlide === TOTAL_SLIDES - 1}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-20 ${
          dark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
        }`}
        style={dark ? undefined : { boxShadow: 'var(--shadow-sm)' }}
      >
        <ChevronRight size={16} />
      </button>
      <span className={`text-[11px] font-medium tabular-nums ml-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
        {currentSlide + 1} / {TOTAL_SLIDES}
      </span>
    </div>
  );

  // ─── Fullscreen Mode ───────────────────────────────────────
  if (fullscreen && deck) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black flex flex-col"
        style={{ minHeight: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-5 h-5 ${t.swatch} rounded flex-shrink-0`} />
            <span className="text-white/50 text-xs sm:text-sm font-medium truncate">{project.name}</span>
          </div>
          <button
            onClick={() => setFullscreen(false)}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] bg-white/10 active:bg-white/20 rounded-lg text-white/70 text-xs font-medium"
          >
            <Minimize2 size={13} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>

        {/* Slide — fills remaining space */}
        <div
          className="flex-1 flex items-center justify-center px-3 sm:px-8 overflow-y-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-full max-w-5xl">
            <div key={currentSlide} className={slideDirection === 'right' ? 'slide-enter-right' : 'slide-enter-left'}>
              {currentSlide === 0 ? renderSlide1(true) : renderSlide2(true)}
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex-shrink-0 pb-2 sm:pb-4">
          <SlideNav dark />
          {/* Hint — desktop only */}
          <div className="hidden sm:flex items-center justify-center gap-4 text-white/15 text-[10px] mt-2">
            <span>Arrow keys to navigate</span>
            <span>ESC to exit</span>
          </div>
          {/* Hint — mobile */}
          <p className="sm:hidden text-center text-white/15 text-[10px] mt-1.5">Swipe to navigate</p>
        </div>
      </div>
    );
  }

  // ─── Initial State ─────────────────────────────────────────
  if (!deck && !loading) {
    return (
      <div className="mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Presentation size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Pitch Deck Generator</h3>
                <p className="text-xs text-gray-400 mt-0.5">AI-generated 2-slide pitch deck</p>
              </div>
            </div>

            {/* Theme picker — mobile: horizontal strip + preview, desktop: side by side */}

            {/* Mobile: horizontal theme strip */}
            <div className="sm:hidden mb-4">
              <label className="block text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-2.5">Theme</label>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, th]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`flex-shrink-0 w-[72px] rounded-xl border-2 overflow-hidden transition-all active:scale-95 ${
                      theme === key ? 'border-indigo-500 shadow-md' : 'border-gray-100'
                    }`}
                  >
                    <div className={`${th.swatch} h-10`} />
                    <div className="px-1.5 py-1.5 bg-white">
                      <div className="text-[10px] font-semibold text-gray-900 text-center truncate">{th.name}</div>
                    </div>
                  </button>
                ))}
              </div>
              {/* Mobile preview below strip */}
              <div className="mt-3 transition-all duration-500 rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5">
                <ThemePreview theme={theme} projectName={project.name} />
              </div>
            </div>

            {/* Desktop: side by side */}
            <div className="hidden sm:grid grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-2.5">Preview</label>
                <div className="transition-all duration-500 rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5">
                  <ThemePreview theme={theme} projectName={project.name} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-2.5">Theme</label>
                <div className="space-y-2">
                  {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, th]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl border-2 transition-all active:scale-[0.98] ${
                        theme === key
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${th.swatch} flex-shrink-0`} />
                      <div className="text-left min-w-0">
                        <div className="text-xs font-semibold text-gray-900">{th.name}</div>
                        <div className="text-[10px] text-gray-400">{th.label}</div>
                      </div>
                      {theme === key && (
                        <div className="ml-auto w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={() => generateDeck()}
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 transition-all overflow-hidden"
              style={{ boxShadow: '0 2px 12px rgba(79, 70, 229, 0.3)' }}
            >
              {/* Shimmer on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <Sparkles size={15} className="relative" />
              <span className="relative">Generate Pitch Deck</span>
              <ArrowRight size={14} className="relative ml-0.5" />
            </button>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{error}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading State ─────────────────────────────────────────
  if (loading && !deck) {
    const progressPct = ((loadingStep + 1) / LOADING_STEPS.length) * 100;
    const isDark = theme !== 'ivory';

    return (
      <div className="mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-r-full"
              style={{
                width: `${progressPct}%`,
                transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          </div>

          {/* Full-width skeleton preview — the hero */}
          <div className={`${t.page1Bg} ${t.page1Text} relative overflow-hidden`}>
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.03)'} 50%, transparent 100%)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s ease-in-out infinite',
              }}
            />

            <div className="p-5 sm:p-8 relative z-0">
              {/* Header skeleton */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-200'} flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                      {project.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white/40' : 'text-gray-300'}`}>{project.name}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-300'}`}>{project.stage}</span>
                </div>
              </div>

              {/* Tagline skeleton — progressively revealed */}
              <div className="mb-3 space-y-2">
                <div
                  className={`h-7 sm:h-9 rounded-lg ${isDark ? 'bg-white/[0.08]' : 'bg-gray-100'}`}
                  style={{
                    width: loadingStep >= 2 ? '85%' : '60%',
                    transition: 'width 1s ease-out',
                    opacity: loadingStep >= 2 ? 0.9 : 0.4,
                  }}
                />
                <div
                  className={`h-7 sm:h-9 rounded-lg ${isDark ? 'bg-white/[0.06]' : 'bg-gray-50'}`}
                  style={{
                    width: loadingStep >= 2 ? '55%' : '35%',
                    transition: 'width 1s ease-out 0.15s',
                    opacity: loadingStep >= 2 ? 0.7 : 0.3,
                  }}
                />
              </div>

              {/* Description skeleton */}
              <div className="mb-6 space-y-1.5">
                <div className={`h-3 rounded-full ${isDark ? 'bg-white/[0.05]' : 'bg-gray-50'}`} style={{ width: '90%', opacity: loadingStep >= 1 ? 0.6 : 0.2, transition: 'opacity 0.8s' }} />
                <div className={`h-3 rounded-full ${isDark ? 'bg-white/[0.04]' : 'bg-gray-50'}`} style={{ width: '65%', opacity: loadingStep >= 1 ? 0.4 : 0.15, transition: 'opacity 0.8s' }} />
              </div>

              {/* Cards skeleton — appear at step 3+ */}
              <div className="grid grid-cols-2 gap-3" style={{ opacity: loadingStep >= 3 ? 1 : 0.3, transition: 'opacity 1s ease-out' }}>
                <div className={`${isDark ? 'bg-white/[0.06] border border-white/10' : 'bg-gray-50 border border-gray-100'} rounded-xl p-4 sm:p-5`}>
                  <div className={`w-6 h-6 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-200'} mb-3`} />
                  <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} w-16 mb-2`} />
                  <div className="space-y-1.5">
                    <div className={`h-2 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'} w-full`} />
                    <div className={`h-2 rounded-full ${isDark ? 'bg-white/[0.05]' : 'bg-gray-100'} w-4/5`} />
                    <div className={`h-2 rounded-full ${isDark ? 'bg-white/[0.04]' : 'bg-gray-50'} w-3/5`} />
                  </div>
                </div>
                <div className={`${isDark ? 'bg-white/[0.06] border border-white/10' : 'bg-gray-50 border border-gray-100'} rounded-xl p-4 sm:p-5`}>
                  <div className={`w-6 h-6 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-200'} mb-3`} />
                  <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} w-14 mb-2`} />
                  <div className="space-y-1.5">
                    <div className={`h-2 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'} w-full`} />
                    <div className={`h-2 rounded-full ${isDark ? 'bg-white/[0.05]' : 'bg-gray-100'} w-3/4`} />
                    <div className={`h-2 rounded-full ${isDark ? 'bg-white/[0.04]' : 'bg-gray-50'} w-2/3`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Steps + tip area */}
          <div className="px-5 sm:px-8 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
              {/* Steps */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Sparkles size={13} className="text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Building your deck</h3>
                    <p className="text-[11px] text-gray-400">{Math.round(progressPct)}% complete</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {LOADING_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500 ${
                        i === loadingStep ? 'bg-indigo-50' : i < loadingStep ? 'bg-gray-50/50' : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        i < loadingStep ? 'bg-indigo-500' :
                        i === loadingStep ? 'bg-indigo-500' :
                        'bg-gray-200'
                      }`}>
                        {i < loadingStep ? (
                          <Check size={10} className="text-white" />
                        ) : i === loadingStep ? (
                          <Loader2 size={10} className="animate-spin text-white" />
                        ) : (
                          <span className="text-[8px] font-bold text-gray-400">{i + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-medium transition-colors duration-300 ${
                          i === loadingStep ? 'text-indigo-700' : i < loadingStep ? 'text-gray-500' : 'text-gray-300'
                        }`}>
                          {step.label}
                        </span>
                        {i === loadingStep && (
                          <p className="text-[10px] text-indigo-400 mt-0.5">{step.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip card */}
              <div className="sm:w-56 flex-shrink-0">
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Lightbulb size={12} className="text-amber-500" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Did you know</span>
                  </div>
                  <p
                    key={loadingTip}
                    className="text-xs text-gray-500 leading-relaxed"
                    style={{ animation: 'fadeInUp 0.5s ease-out' }}
                  >
                    {LOADING_TIPS[loadingTip]}
                  </p>
                </div>
                <p className="text-[10px] text-gray-300 text-center mt-3">
                  {THEMES[theme].name} theme selected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!deck) return null;

  // ─── Full Deck Viewer ──────────────────────────────────────
  return (
    <div className="mt-4 space-y-3">
      {/* Main deck card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Slim top bar — theme, slide nav, secondary actions */}
        <div className="px-4 sm:px-5 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {/* Left: theme picker */}
            <div className="relative" ref={themePickerRef}>
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showThemePicker ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded ${t.swatch} flex-shrink-0`} />
                <span className="hidden sm:inline">{THEMES[theme].name}</span>
              </button>
              {showThemePicker && (
                <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-gray-100 p-2 w-48 slide-scale-in" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                  {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, th]) => (
                    <button
                      key={key}
                      onClick={() => { setTheme(key); setShowThemePicker(false); }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                        theme === key ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded ${th.swatch} flex-shrink-0`} />
                      <span className="text-xs font-medium">{th.name}</span>
                      {theme === key && <Check size={11} className="ml-auto text-indigo-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Center: slide nav */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSlideDirection('left'); setCurrentSlide(0); }}
                disabled={currentSlide === 0}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === currentSlide ? 'w-5 h-1.5 bg-indigo-500' : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => { setSlideDirection('right'); setCurrentSlide(1); }}
                disabled={currentSlide === TOTAL_SLIDES - 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={14} />
              </button>
              <span className="text-[10px] text-gray-300 font-medium tabular-nums ml-0.5">{currentSlide + 1}/{TOTAL_SLIDES}</span>
            </div>

            {/* Right: secondary actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => generateDeck()}
                disabled={loading || refining}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 transition-colors"
                title="Regenerate"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              </button>
              <button
                onClick={() => setFullscreen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{error}</div>
        )}

        {/* Slide Viewport — with swipe support */}
        <div
          className="flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 bg-gray-50/50 min-h-[320px] sm:min-h-[500px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {refining && (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium mb-4 w-full max-w-3xl">
              <Loader2 size={13} className="animate-spin" />
              Refining your deck...
            </div>
          )}

          <div className="w-full max-w-3xl">
            <div
              key={`${currentSlide}-${theme}`}
              className={slideDirection === 'right' ? 'slide-enter-right' : 'slide-enter-left'}
            >
              {currentSlide === 0 ? renderSlide1() : renderSlide2()}
            </div>

            {/* Mobile slide dots */}
            <div className="sm:hidden">
              <SlideNav />
            </div>
          </div>
        </div>

        {/* ── Prominent Action Bar ── */}
        <div className="border-t border-gray-100 bg-white px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {/* Save to Files */}
            <button
              onClick={handleSaveToFiles}
              disabled={saving}
              className={`group flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
                saved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700'
              }`}
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : saved ? (
                <Check size={15} />
              ) : (
                <Save size={15} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
              )}
              {saving ? 'Saving...' : saved ? 'Saved to Files' : 'Save to Files'}
            </button>

            {/* Download PDF — primary */}
            <button
              onClick={handleDownloadPDF}
              className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all"
              style={{ boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}
            >
              <Download size={15} />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Refine with AI Card — always visible ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Header */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="w-full px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-gray-900">Refine with AI</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Tell the AI what to improve in your deck</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {comments.length > 0 && (
              <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">{comments.length}</span>
            )}
            <ChevronRight size={16} className={`text-gray-300 transition-transform duration-200 ${showComments ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {/* Expandable chat area */}
        {showComments && (
          <div className="border-t border-gray-100">
            {/* Chat history */}
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
              {comments.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400">No revisions yet — try a suggestion below</p>
                </div>
              )}
              {comments.map((c) => (
                <div key={c.id} className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[85%] ${
                  c.type === 'user' ? 'bg-indigo-600 text-white ml-auto' : 'bg-gray-50 border border-gray-100 text-gray-600'
                }`}>
                  {c.text}
                </div>
              ))}
              {refining && <TypingIndicator />}
              <div ref={commentEndRef} />
            </div>

            {/* Quick suggestions */}
            {comments.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {['Punchier tagline', 'More traction data', 'Bigger market angle', 'Add team expertise'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCommentInput(s)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[11px] text-gray-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.97] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50/30">
              <div className="flex gap-2">
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                  placeholder="e.g. Make the tagline shorter and punchier..."
                  disabled={refining}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 placeholder:text-gray-300 transition-all"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentInput.trim() || refining}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-30 active:scale-[0.97] transition-all flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span className="hidden sm:inline text-sm font-medium">Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile theme bottom sheet */}
      {showMobileThemeSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end" onClick={() => setShowMobileThemeSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full bg-white rounded-t-2xl p-4 pb-8" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Choose Theme</h4>
            <div className="space-y-1.5">
              {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, th]) => (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setShowMobileThemeSheet(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] ${
                    theme === key ? 'bg-indigo-50 border-2 border-indigo-500' : 'border-2 border-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${th.swatch} flex-shrink-0`} />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">{th.name}</div>
                    <div className="text-[11px] text-gray-400">{th.label}</div>
                  </div>
                  {theme === key && <Check size={16} className="ml-auto text-indigo-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
