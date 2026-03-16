'use client';

import { useState, useRef } from 'react';
import {
  FileText, Sparkles, Loader2, Download, RefreshCw,
  Target, Lightbulb, TrendingUp, DollarSign, Shield,
  Rocket, ChevronRight, Globe, Zap, BarChart3,
  Send, MessageSquare, Palette, Check, Save,
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
}

interface Comment {
  id: number;
  text: string;
  type: 'user' | 'system';
  timestamp: Date;
}

// ─── Theme definitions ──────────────────────────────────────
const THEMES = {
  midnight: {
    name: 'Midnight',
    label: 'Dark & Bold',
    page1Bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.06] border border-white/10',
    cardTitle: 'text-white/50',
    cardText: 'text-white/80',
    accentIcon1: 'bg-red-500/20',
    accentIcon1Text: 'text-red-400',
    accentIcon2: 'bg-emerald-500/20',
    accentIcon2Text: 'text-emerald-400',
    accentIcon3: 'bg-blue-500/20',
    accentIcon3Text: 'text-blue-400',
    stepNumBg: 'bg-white/15',
    page2Bg: 'bg-white',
    statBg: 'bg-gray-50',
    sectionCardBg: 'bg-gray-50',
    sectionIconBg: 'bg-gray-900',
    sectionIconText: 'text-white',
    sectionTitle: 'text-gray-400',
    sectionText: 'text-gray-700',
    dotColor: 'bg-gray-900',
    ctaBg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
    fundColors: ['bg-gray-900', 'bg-gray-700', 'bg-gray-500', 'bg-gray-400'],
    fundColorHex: ['#111', '#444', '#888', '#bbb'],
    previewDot: 'bg-gray-900',
    previewRing: 'ring-gray-900',
    badgeBg: 'bg-white/10',
    taglineBg: '',
    footerBg: 'bg-gray-900',
    footerText: 'text-white/30',
    footer2Bg: 'bg-gray-50 border-t border-gray-100',
    footer2Text: 'text-gray-300',
    pdfPage1: 'background: linear-gradient(135deg, #111 0%, #1a1a2e 50%, #16213e 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);',
    pdfPage2: 'background: #ffffff; color: #111;',
    pdfStatBg: 'background: #f8f9fa;',
    pdfCtaBg: 'background: linear-gradient(135deg, #111 0%, #1a1a2e 100%); color: white;',
  },
  ocean: {
    name: 'Ocean',
    label: 'Blue & Professional',
    page1Bg: 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.08] border border-white/10',
    cardTitle: 'text-blue-200/60',
    cardText: 'text-white/85',
    accentIcon1: 'bg-orange-500/20',
    accentIcon1Text: 'text-orange-400',
    accentIcon2: 'bg-cyan-500/20',
    accentIcon2Text: 'text-cyan-400',
    accentIcon3: 'bg-sky-500/20',
    accentIcon3Text: 'text-sky-400',
    stepNumBg: 'bg-white/15',
    page2Bg: 'bg-white',
    statBg: 'bg-blue-50',
    sectionCardBg: 'bg-blue-50/50',
    sectionIconBg: 'bg-blue-700',
    sectionIconText: 'text-white',
    sectionTitle: 'text-blue-400',
    sectionText: 'text-gray-700',
    dotColor: 'bg-blue-700',
    ctaBg: 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900',
    fundColors: ['bg-blue-900', 'bg-blue-600', 'bg-blue-400', 'bg-blue-300'],
    fundColorHex: ['#1e3a5f', '#2563eb', '#60a5fa', '#93c5fd'],
    previewDot: 'bg-blue-700',
    previewRing: 'ring-blue-600',
    badgeBg: 'bg-white/15',
    taglineBg: '',
    footerBg: 'bg-blue-900',
    footerText: 'text-blue-200/30',
    footer2Bg: 'bg-blue-50 border-t border-blue-100',
    footer2Text: 'text-blue-300',
    pdfPage1: 'background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #312e81 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);',
    pdfPage2: 'background: #ffffff; color: #111;',
    pdfStatBg: 'background: #eff6ff;',
    pdfCtaBg: 'background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%); color: white;',
  },
  emerald: {
    name: 'Emerald',
    label: 'Green & Fresh',
    page1Bg: 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.08] border border-white/10',
    cardTitle: 'text-emerald-200/60',
    cardText: 'text-white/85',
    accentIcon1: 'bg-rose-500/20',
    accentIcon1Text: 'text-rose-400',
    accentIcon2: 'bg-lime-500/20',
    accentIcon2Text: 'text-lime-400',
    accentIcon3: 'bg-teal-500/20',
    accentIcon3Text: 'text-teal-400',
    stepNumBg: 'bg-white/15',
    page2Bg: 'bg-white',
    statBg: 'bg-emerald-50',
    sectionCardBg: 'bg-emerald-50/50',
    sectionIconBg: 'bg-emerald-700',
    sectionIconText: 'text-white',
    sectionTitle: 'text-emerald-500',
    sectionText: 'text-gray-700',
    dotColor: 'bg-emerald-700',
    ctaBg: 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900',
    fundColors: ['bg-emerald-900', 'bg-emerald-600', 'bg-emerald-400', 'bg-emerald-300'],
    fundColorHex: ['#064e3b', '#059669', '#34d399', '#6ee7b7'],
    previewDot: 'bg-emerald-700',
    previewRing: 'ring-emerald-600',
    badgeBg: 'bg-white/15',
    taglineBg: '',
    footerBg: 'bg-emerald-900',
    footerText: 'text-emerald-200/30',
    footer2Bg: 'bg-emerald-50 border-t border-emerald-100',
    footer2Text: 'text-emerald-300',
    pdfPage1: 'background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #134e4a 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);',
    pdfPage2: 'background: #ffffff; color: #111;',
    pdfStatBg: 'background: #ecfdf5;',
    pdfCtaBg: 'background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); color: white;',
  },
  sunset: {
    name: 'Sunset',
    label: 'Warm & Vibrant',
    page1Bg: 'bg-gradient-to-br from-orange-900 via-rose-800 to-purple-900',
    page1Text: 'text-white',
    cardBg: 'bg-white/[0.08] border border-white/10',
    cardTitle: 'text-orange-200/60',
    cardText: 'text-white/85',
    accentIcon1: 'bg-yellow-500/20',
    accentIcon1Text: 'text-yellow-400',
    accentIcon2: 'bg-pink-500/20',
    accentIcon2Text: 'text-pink-400',
    accentIcon3: 'bg-purple-500/20',
    accentIcon3Text: 'text-purple-400',
    stepNumBg: 'bg-white/15',
    page2Bg: 'bg-white',
    statBg: 'bg-orange-50',
    sectionCardBg: 'bg-orange-50/50',
    sectionIconBg: 'bg-orange-700',
    sectionIconText: 'text-white',
    sectionTitle: 'text-orange-400',
    sectionText: 'text-gray-700',
    dotColor: 'bg-orange-700',
    ctaBg: 'bg-gradient-to-br from-orange-900 via-rose-800 to-purple-900',
    fundColors: ['bg-orange-800', 'bg-rose-600', 'bg-purple-500', 'bg-amber-400'],
    fundColorHex: ['#9a3412', '#e11d48', '#a855f7', '#fbbf24'],
    previewDot: 'bg-orange-600',
    previewRing: 'ring-orange-500',
    badgeBg: 'bg-white/15',
    taglineBg: '',
    footerBg: 'bg-orange-900',
    footerText: 'text-orange-200/30',
    footer2Bg: 'bg-orange-50 border-t border-orange-100',
    footer2Text: 'text-orange-300',
    pdfPage1: 'background: linear-gradient(135deg, #7c2d12 0%, #9f1239 50%, #581c87 100%); color: white;',
    pdfCardBg: 'background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);',
    pdfPage2: 'background: #ffffff; color: #111;',
    pdfStatBg: 'background: #fff7ed;',
    pdfCtaBg: 'background: linear-gradient(135deg, #7c2d12 0%, #9f1239 100%); color: white;',
  },
  minimal: {
    name: 'Minimal',
    label: 'Clean & Light',
    page1Bg: 'bg-white',
    page1Text: 'text-gray-900',
    cardBg: 'bg-gray-50 border border-gray-200',
    cardTitle: 'text-gray-400',
    cardText: 'text-gray-700',
    accentIcon1: 'bg-red-100',
    accentIcon1Text: 'text-red-600',
    accentIcon2: 'bg-emerald-100',
    accentIcon2Text: 'text-emerald-600',
    accentIcon3: 'bg-blue-100',
    accentIcon3Text: 'text-blue-600',
    stepNumBg: 'bg-gray-900 text-white',
    page2Bg: 'bg-gray-50',
    statBg: 'bg-white border border-gray-200',
    sectionCardBg: 'bg-white border border-gray-200',
    sectionIconBg: 'bg-gray-900',
    sectionIconText: 'text-white',
    sectionTitle: 'text-gray-400',
    sectionText: 'text-gray-700',
    dotColor: 'bg-gray-900',
    ctaBg: 'bg-gray-900',
    fundColors: ['bg-gray-900', 'bg-gray-600', 'bg-gray-400', 'bg-gray-300'],
    fundColorHex: ['#111', '#555', '#999', '#ccc'],
    previewDot: 'bg-gray-400',
    previewRing: 'ring-gray-400',
    badgeBg: 'bg-gray-100 text-gray-600',
    taglineBg: '',
    footerBg: 'bg-gray-100',
    footerText: 'text-gray-300',
    footer2Bg: 'bg-white border-t border-gray-100',
    footer2Text: 'text-gray-300',
    pdfPage1: 'background: #ffffff; color: #111;',
    pdfCardBg: 'background: #f9fafb; border: 1px solid #e5e7eb;',
    pdfPage2: 'background: #f9fafb; color: #111;',
    pdfStatBg: 'background: #ffffff; border: 1px solid #e5e7eb;',
    pdfCtaBg: 'background: #111; color: white;',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

export default function PitchDeckSection({ project, onFileSaved }: { project: Project; onFileSaved?: () => void }) {
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<ThemeKey>('midnight');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  const t = THEMES[theme];

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

    const newComment: Comment = {
      id: Date.now(),
      text,
      type: 'user',
      timestamp: new Date(),
    };
    setComments(prev => [...prev, newComment]);
    setCommentInput('');
    generateDeck(text);

    setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDownloadPDF = () => {
    if (!deck) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const th = THEMES[theme];

    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${project.name} - Pitch Deck</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,sans-serif;color:#111}
.page{width:1024px;min-height:768px;padding:64px;page-break-after:always;position:relative;overflow:hidden}
.page-1{${th.pdfPage1}display:flex;flex-direction:column}
.page-1 .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:48px}
.page-1 .logo-name{font-size:28px;font-weight:800;letter-spacing:-0.5px}
.page-1 .stage-badge{background:rgba(255,255,255,0.15);padding:6px 16px;border-radius:20px;font-size:13px;font-weight:500}
.page-1 .tagline{font-size:42px;font-weight:800;line-height:1.15;margin-bottom:16px;letter-spacing:-1px;max-width:700px}
.page-1 .desc{font-size:18px;opacity:0.7;margin-bottom:48px;max-width:600px;line-height:1.6}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:24px;flex:1}
.card{${th.pdfCardBg}border-radius:16px;padding:28px}
.card-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:12px;opacity:0.6}
.card-text{font-size:15px;line-height:1.65}
.card-dark{${th.pdfStatBg}border-radius:16px;padding:28px;color:#111}
.card-dark .card-title{color:#666}
.steps{list-style:none;padding:0}
.steps li{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;font-size:14px;line-height:1.5}
.step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;background:rgba(255,255,255,0.2)}
.page-2{${th.pdfPage2}}
.page-2-header{display:flex;align-items:center;gap:12px;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #f0f0f0}
.page-2-header .logo-name{font-size:20px;font-weight:700}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:32px}
.stat-card{text-align:center;padding:24px 16px;${th.pdfStatBg}border-radius:12px}
.stat-value{font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px}
.stat-label{font-size:12px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}
.traction-dot{width:6px;height:6px;border-radius:50%;background:${th.fundColorHex[0]};flex-shrink:0;margin-top:6px}
.traction-item{display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
.edge-check{width:20px;height:20px;background:${th.fundColorHex[0]};color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.edge-item{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px}
.fund-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:12px 0}
.fund-bar div{height:100%}
.fund-legend{display:flex;flex-wrap:wrap;gap:16px;margin-top:8px}
.fund-item{display:flex;align-items:center;gap:6px;font-size:12px}
.fund-dot{width:8px;height:8px;border-radius:2px}
.cta-bar{margin-top:32px;padding:28px 32px;${th.pdfCtaBg}border-radius:16px;display:flex;align-items:center;justify-content:space-between}
.cta-bar .vision{font-size:16px;font-weight:600;max-width:500px;line-height:1.5}
.cta-bar .contact{text-align:right;font-size:13px;opacity:0.8}
@media print{.page{page-break-after:always}}
</style></head><body>
<div class="page page-1">
  <div class="header"><div class="logo-name">${project.name}</div><div class="stage-badge">${project.stage}${project.location ? ' &middot; ' + project.location : ''}</div></div>
  <div class="tagline">${deck.tagline}</div>
  <div class="desc">${project.description}</div>
  <div class="grid-2">
    <div class="card"><div class="card-title">${deck.problemTitle || 'The Problem'}</div><div class="card-text">${deck.problem}</div></div>
    <div class="card"><div class="card-title">${deck.solutionTitle || 'The Solution'}</div><div class="card-text">${deck.solution}</div></div>
    <div class="card" style="grid-column:span 2"><div class="card-title">How It Works</div><ol class="steps">${(deck.howItWorks || []).map((s: string, i: number) => `<li><div class="step-num">${i + 1}</div><span>${s}</span></li>`).join('')}</ol></div>
  </div>
</div>
<div class="page page-2">
  <div class="page-2-header"><div class="logo-name">${project.name}</div></div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-value">${deck.marketSize || 'TBD'}</div><div class="stat-label">Market Size (TAM)</div></div>
    <div class="stat-card"><div class="stat-value">${deck.askAmount || project.raiseAmount || 'TBD'}</div><div class="stat-label">Raising</div></div>
    <div class="stat-card"><div class="stat-value">${project.stage}</div><div class="stat-label">Stage</div></div>
  </div>
  <div class="grid-2">
    <div class="card-dark"><div class="card-title">Traction & Milestones</div>${(deck.traction || []).map((t: string) => `<div class="traction-item"><div class="traction-dot"></div>${t}</div>`).join('')}</div>
    <div class="card-dark"><div class="card-title">Competitive Advantages</div>${(deck.competitiveEdge || []).map((e: string) => `<div class="edge-item"><div class="edge-check">&#10003;</div>${e}</div>`).join('')}</div>
    <div class="card-dark"><div class="card-title">Business Model</div><div class="card-text">${deck.businessModel}</div></div>
    <div class="card-dark"><div class="card-title">Use of Funds</div><div class="fund-bar">${(deck.useOfFunds || []).map((f: { percentage: number }, i: number) => `<div style="width:${f.percentage}%;background:${th.fundColorHex[i] || '#ddd'}"></div>`).join('')}</div><div class="fund-legend">${(deck.useOfFunds || []).map((f: { category: string; percentage: number }, i: number) => `<div class="fund-item"><div class="fund-dot" style="background:${th.fundColorHex[i] || '#ddd'}"></div>${f.category} (${f.percentage}%)</div>`).join('')}</div></div>
  </div>
  <div class="cta-bar"><div class="vision">${deck.vision}</div><div class="contact">${deck.contactWebsite ? '<div>' + deck.contactWebsite + '</div>' : ''}${deck.contactEmail ? '<div>' + deck.contactEmail + '</div>' : ''}</div></div>
</div>
</body></html>`);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const buildDeckHTML = () => {
    if (!deck) return '';
    const th = THEMES[theme];
    return `<!DOCTYPE html>
<html><head><title>${project.name} - Pitch Deck</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,sans-serif;color:#111}
.page{width:1024px;min-height:768px;padding:64px;page-break-after:always;position:relative;overflow:hidden;margin:0 auto}
.page-1{${th.pdfPage1}display:flex;flex-direction:column}
.page-1 .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:48px}
.page-1 .logo-name{font-size:28px;font-weight:800;letter-spacing:-0.5px}
.page-1 .stage-badge{background:rgba(255,255,255,0.15);padding:6px 16px;border-radius:20px;font-size:13px;font-weight:500}
.page-1 .tagline{font-size:42px;font-weight:800;line-height:1.15;margin-bottom:16px;letter-spacing:-1px;max-width:700px}
.page-1 .desc{font-size:18px;opacity:0.7;margin-bottom:48px;max-width:600px;line-height:1.6}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:24px;flex:1}
.card{${th.pdfCardBg}border-radius:16px;padding:28px}
.card-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:12px;opacity:0.6}
.card-text{font-size:15px;line-height:1.65}
.card-dark{${th.pdfStatBg}border-radius:16px;padding:28px;color:#111}
.card-dark .card-title{color:#666}
.steps{list-style:none;padding:0}
.steps li{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;font-size:14px;line-height:1.5}
.step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;background:rgba(255,255,255,0.2)}
.page-2{${th.pdfPage2}}
.page-2-header{display:flex;align-items:center;gap:12px;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #f0f0f0}
.page-2-header .logo-name{font-size:20px;font-weight:700}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:32px}
.stat-card{text-align:center;padding:24px 16px;${th.pdfStatBg}border-radius:12px}
.stat-value{font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px}
.stat-label{font-size:12px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}
.traction-dot{width:6px;height:6px;border-radius:50%;background:${th.fundColorHex[0]};flex-shrink:0;margin-top:6px}
.traction-item{display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
.edge-check{width:20px;height:20px;background:${th.fundColorHex[0]};color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.edge-item{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px}
.fund-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:12px 0}
.fund-bar div{height:100%}
.fund-legend{display:flex;flex-wrap:wrap;gap:16px;margin-top:8px}
.fund-item{display:flex;align-items:center;gap:6px;font-size:12px}
.fund-dot{width:8px;height:8px;border-radius:2px}
.cta-bar{margin-top:32px;padding:28px 32px;${th.pdfCtaBg}border-radius:16px;display:flex;align-items:center;justify-content:space-between}
.cta-bar .vision{font-size:16px;font-weight:600;max-width:500px;line-height:1.5}
.cta-bar .contact{text-align:right;font-size:13px;opacity:0.8}
@media print{.page{page-break-after:always}}
</style></head><body>
<div class="page page-1">
  <div class="header"><div class="logo-name">${project.name}</div><div class="stage-badge">${project.stage}${project.location ? ' &middot; ' + project.location : ''}</div></div>
  <div class="tagline">${deck.tagline}</div>
  <div class="desc">${project.description}</div>
  <div class="grid-2">
    <div class="card"><div class="card-title">${deck.problemTitle || 'The Problem'}</div><div class="card-text">${deck.problem}</div></div>
    <div class="card"><div class="card-title">${deck.solutionTitle || 'The Solution'}</div><div class="card-text">${deck.solution}</div></div>
    <div class="card" style="grid-column:span 2"><div class="card-title">How It Works</div><ol class="steps">${(deck.howItWorks || []).map((s: string, i: number) => `<li><div class="step-num">${i + 1}</div><span>${s}</span></li>`).join('')}</ol></div>
  </div>
</div>
<div class="page page-2">
  <div class="page-2-header"><div class="logo-name">${project.name}</div></div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-value">${deck.marketSize || 'TBD'}</div><div class="stat-label">Market Size (TAM)</div></div>
    <div class="stat-card"><div class="stat-value">${deck.askAmount || project.raiseAmount || 'TBD'}</div><div class="stat-label">Raising</div></div>
    <div class="stat-card"><div class="stat-value">${project.stage}</div><div class="stat-label">Stage</div></div>
  </div>
  <div class="grid-2">
    <div class="card-dark"><div class="card-title">Traction & Milestones</div>${(deck.traction || []).map((t: string) => `<div class="traction-item"><div class="traction-dot"></div>${t}</div>`).join('')}</div>
    <div class="card-dark"><div class="card-title">Competitive Advantages</div>${(deck.competitiveEdge || []).map((e: string) => `<div class="edge-item"><div class="edge-check">&#10003;</div>${e}</div>`).join('')}</div>
    <div class="card-dark"><div class="card-title">Business Model</div><div class="card-text">${deck.businessModel}</div></div>
    <div class="card-dark"><div class="card-title">Use of Funds</div><div class="fund-bar">${(deck.useOfFunds || []).map((f: { percentage: number }, i: number) => `<div style="width:${f.percentage}%;background:${th.fundColorHex[i] || '#ddd'}"></div>`).join('')}</div><div class="fund-legend">${(deck.useOfFunds || []).map((f: { category: string; percentage: number }, i: number) => `<div class="fund-item"><div class="fund-dot" style="background:${th.fundColorHex[i] || '#ddd'}"></div>${f.category} (${f.percentage}%)</div>`).join('')}</div></div>
  </div>
  <div class="cta-bar"><div class="vision">${deck.vision}</div><div class="contact">${deck.contactWebsite ? '<div>' + deck.contactWebsite + '</div>' : ''}${deck.contactEmail ? '<div>' + deck.contactEmail + '</div>' : ''}</div></div>
</div>
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
        body: JSON.stringify({
          projectId: project.id,
          htmlContent,
          fileName: `${project.name}-Pitch-Deck`,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSaved(true);
        onFileSaved?.();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Failed to save pitch deck to files.');
    }
    setSaving(false);
  };

  // ─── Initial State: Generate button ──────────────────────
  if (!deck && !loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Pitch Deck Generator</h3>
              <p className="text-xs text-gray-400 mt-0.5">AI-generated 2-page pitch deck with custom themes</p>
            </div>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="mb-5">
          <label className="block text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-2.5">
            <Palette size={11} className="inline mr-1" />
            Choose Theme
          </label>
          <div className="grid grid-cols-5 gap-2">
            {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, th]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                  theme === key
                    ? `border-gray-900 shadow-sm`
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className={`w-3 h-3 rounded-full ${th.previewDot}`} />
                  <div className={`w-3 h-3 rounded-full ${th.previewDot} opacity-60`} />
                  <div className={`w-3 h-3 rounded-full ${th.previewDot} opacity-30`} />
                </div>
                <div className="text-xs font-semibold text-gray-900">{th.name}</div>
                <div className="text-[10px] text-gray-400">{th.label}</div>
                {theme === key && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => generateDeck()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          <Sparkles size={15} />
          Generate Pitch Deck
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ─── Loading State ───────────────────────────────────────
  if (loading && !deck) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 mt-4">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center mb-4 animate-pulse">
            <Sparkles size={20} className="text-white" />
          </div>
          <Loader2 size={24} className="text-gray-400 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-900">Generating your pitch deck...</p>
          <p className="text-xs text-gray-400 mt-1">AI is crafting compelling content for {project.name}</p>
        </div>
      </div>
    );
  }

  if (!deck) return null;

  // ─── Full Deck Viewer with Comments Panel ────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 mt-4 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Pitch Deck</h3>
            <p className="text-[11px] text-gray-400">
              {THEMES[theme].name} theme · 2 pages
              {comments.filter(c => c.type === 'user').length > 0 && (
                <span> · {comments.filter(c => c.type === 'user').length} revision{comments.filter(c => c.type === 'user').length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Selector (compact) */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, th]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                title={th.name}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                  theme === key ? 'bg-white shadow-sm' : 'hover:bg-gray-200/50'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${th.previewDot}`} />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-colors ${
              showComments
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageSquare size={12} />
            Refine
            {comments.filter(c => c.type === 'user').length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                showComments ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {comments.filter(c => c.type === 'user').length}
              </span>
            )}
          </button>
          <button
            onClick={() => generateDeck()}
            disabled={loading || refining}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Regenerate
          </button>
          <button
            onClick={handleSaveToFiles}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-colors ${
              saved
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <Save size={12} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save to Files'}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800 transition-colors"
          >
            <Download size={12} />
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex">
        {/* Deck Preview */}
        <div className={`flex-1 p-5 space-y-4 transition-all ${showComments ? 'pr-0' : ''}`}>
          {refining && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              <Loader2 size={13} className="animate-spin" />
              Refining your deck based on feedback...
            </div>
          )}

          {/* ────── PAGE 1 ────── */}
          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <div className={`${t.page1Bg} ${t.page1Text} p-8`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  {project.logoUrl ? (
                    <img src={project.logoUrl} alt={project.name} className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                      <span className="text-sm font-bold">{project.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}</span>
                    </div>
                  )}
                  <span className="text-lg font-bold tracking-tight">{project.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 ${t.badgeBg} rounded-full text-xs font-medium`}>{project.stage}</span>
                  {project.location && <span className={`px-3 py-1 ${t.badgeBg} rounded-full text-xs font-medium`}>{project.location}</span>}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-3 max-w-2xl">{deck.tagline}</h1>
              <p className="text-base opacity-60 max-w-xl leading-relaxed">{project.description}</p>
            </div>

            <div className={`${t.page1Bg} ${t.page1Text} px-8 pb-8`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className={`${t.cardBg} rounded-2xl p-6`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 ${t.accentIcon1} rounded-lg flex items-center justify-center`}>
                      <Target size={14} className={t.accentIcon1Text} />
                    </div>
                    <span className={`text-[11px] uppercase tracking-widest ${t.cardTitle} font-semibold`}>{deck.problemTitle || 'The Problem'}</span>
                  </div>
                  <p className={`text-sm ${t.cardText} leading-relaxed`}>{deck.problem}</p>
                </div>
                <div className={`${t.cardBg} rounded-2xl p-6`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 ${t.accentIcon2} rounded-lg flex items-center justify-center`}>
                      <Lightbulb size={14} className={t.accentIcon2Text} />
                    </div>
                    <span className={`text-[11px] uppercase tracking-widest ${t.cardTitle} font-semibold`}>{deck.solutionTitle || 'The Solution'}</span>
                  </div>
                  <p className={`text-sm ${t.cardText} leading-relaxed`}>{deck.solution}</p>
                </div>
              </div>
              <div className={`${t.cardBg} rounded-2xl p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-7 h-7 ${t.accentIcon3} rounded-lg flex items-center justify-center`}>
                    <Zap size={14} className={t.accentIcon3Text} />
                  </div>
                  <span className={`text-[11px] uppercase tracking-widest ${t.cardTitle} font-semibold`}>How It Works</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(deck.howItWorks || []).map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 ${t.stepNumBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className="text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className={`text-sm opacity-70 leading-relaxed`}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={`${t.footerBg} px-8 py-2 flex items-center justify-center`}>
              <span className={`text-[10px] ${t.footerText} uppercase tracking-widest`}>Page 1 of 2</span>
            </div>
          </div>

          {/* ────── PAGE 2 ────── */}
          <div className={`rounded-xl overflow-hidden shadow-lg border border-gray-200 ${t.page2Bg}`}>
            <div className="px-8 pt-8 pb-4 border-b border-gray-100 flex items-center gap-3">
              {project.logoUrl ? (
                <img src={project.logoUrl} alt={project.name} className="w-8 h-8 rounded-lg object-contain border border-gray-100 p-0.5" />
              ) : (
                <div className={`w-8 h-8 rounded-lg ${t.sectionIconBg} flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${t.sectionIconText}`}>{project.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}</span>
                </div>
              )}
              <span className="text-base font-bold text-gray-900 tracking-tight">{project.name}</span>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: TrendingUp, value: deck.marketSize || 'TBD', label: 'Market Size (TAM)' },
                  { icon: DollarSign, value: deck.askAmount || project.raiseAmount || 'TBD', label: 'Raising' },
                  { icon: BarChart3, value: project.stage, label: 'Stage' },
                ].map((stat, i) => (
                  <div key={i} className={`text-center p-5 ${t.statBg} rounded-2xl`}>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <stat.icon size={14} className="text-gray-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{stat.value}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`${t.sectionCardBg} rounded-2xl p-6`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-7 h-7 ${t.sectionIconBg} rounded-lg flex items-center justify-center`}>
                      <TrendingUp size={13} className={t.sectionIconText} />
                    </div>
                    <span className={`text-[11px] uppercase tracking-widest ${t.sectionTitle} font-semibold`}>Traction & Milestones</span>
                  </div>
                  <div className="space-y-3">
                    {(deck.traction || []).map((tr, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={`w-1.5 h-1.5 ${t.dotColor} rounded-full mt-1.5 flex-shrink-0`} />
                        <p className={`text-sm ${t.sectionText} leading-relaxed`}>{tr}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${t.sectionCardBg} rounded-2xl p-6`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-7 h-7 ${t.sectionIconBg} rounded-lg flex items-center justify-center`}>
                      <Shield size={13} className={t.sectionIconText} />
                    </div>
                    <span className={`text-[11px] uppercase tracking-widest ${t.sectionTitle} font-semibold`}>Competitive Advantages</span>
                  </div>
                  <div className="space-y-3">
                    {(deck.competitiveEdge || []).map((e, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={`w-5 h-5 ${t.sectionIconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <ChevronRight size={11} className={t.sectionIconText} />
                        </div>
                        <p className={`text-sm ${t.sectionText} leading-relaxed`}>{e}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${t.sectionCardBg} rounded-2xl p-6`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-7 h-7 ${t.sectionIconBg} rounded-lg flex items-center justify-center`}>
                      <DollarSign size={13} className={t.sectionIconText} />
                    </div>
                    <span className={`text-[11px] uppercase tracking-widest ${t.sectionTitle} font-semibold`}>Business Model</span>
                  </div>
                  <p className={`text-sm ${t.sectionText} leading-relaxed`}>{deck.businessModel}</p>
                </div>

                <div className={`${t.sectionCardBg} rounded-2xl p-6`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-7 h-7 ${t.sectionIconBg} rounded-lg flex items-center justify-center`}>
                      <BarChart3 size={13} className={t.sectionIconText} />
                    </div>
                    <span className={`text-[11px] uppercase tracking-widest ${t.sectionTitle} font-semibold`}>Use of Funds</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden mb-3">
                    {(deck.useOfFunds || []).map((f, i) => (
                      <div key={i} className={`h-full ${t.fundColors[i] || 'bg-gray-300'}`} style={{ width: `${f.percentage}%` }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(deck.useOfFunds || []).map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-sm ${t.fundColors[i] || 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">{f.category} <span className="text-gray-400">({f.percentage}%)</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`${t.ctaBg} rounded-2xl p-6 flex items-center justify-between text-white`}>
                <div className="flex items-start gap-3 max-w-lg">
                  <Rocket size={20} className="text-white/60 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white/80 leading-relaxed font-medium">{deck.vision}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  {deck.contactWebsite && (
                    <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                      <Globe size={11} />{deck.contactWebsite}
                    </div>
                  )}
                  {(project.sectors || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end mt-2">
                      {project.sectors.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white/60">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`${t.footer2Bg} px-8 py-2 flex items-center justify-center`}>
              <span className={`text-[10px] ${t.footer2Text} uppercase tracking-widest`}>Page 2 of 2</span>
            </div>
          </div>
        </div>

        {/* ────── Comments / Refinement Panel ────── */}
        {showComments && (
          <div className="w-80 border-l border-gray-100 flex flex-col bg-gray-50/30">
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare size={14} />
                Refine Your Deck
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Tell the AI what to change — tone, content, numbers, anything
              </p>
            </div>

            {/* Comment History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
              {comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare size={24} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-xs text-gray-400">No comments yet</p>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                    Try: &ldquo;Make the tagline more punchy&rdquo; or &ldquo;Add specific revenue numbers to traction&rdquo;
                  </p>
                </div>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    c.type === 'user'
                      ? 'bg-gray-900 text-white ml-4'
                      : 'bg-white border border-gray-100 text-gray-600 mr-4'
                  }`}
                >
                  {c.text}
                  <div className={`text-[10px] mt-1.5 ${c.type === 'user' ? 'text-white/40' : 'text-gray-300'}`}>
                    {c.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {refining && (
                <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 text-xs text-gray-400 mr-4 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  Updating deck...
                </div>
              )}
              <div ref={commentEndRef} />
            </div>

            {/* Suggestions */}
            {comments.length === 0 && (
              <div className="px-4 pb-2">
                <div className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold mb-2">Quick suggestions</div>
                <div className="space-y-1.5">
                  {[
                    'Make the tagline shorter and punchier',
                    'Add more specific traction metrics',
                    'Make the problem statement more urgent',
                    'Emphasize the team\'s unique expertise',
                    'Focus more on market opportunity',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setCommentInput(suggestion);
                      }}
                      className="block w-full text-left px-3 py-2 bg-white border border-gray-100 rounded-lg text-[11px] text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                  placeholder="e.g. Make the tagline more bold..."
                  disabled={refining}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 placeholder:text-gray-300"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentInput.trim() || refining}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
