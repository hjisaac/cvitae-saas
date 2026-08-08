"use client";

import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import {
  Sparkles, FileText, Play, Loader2, Eye, AlertCircle, X,
  CheckCircle, LogOut, User, Languages, Search, ChevronDown,
  Palette, CreditCard, Check, Crown, Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { parseYaml } from "../../lib/yaml";
import {
  generatePDF, fetchProfiles, fetchFileContent,
  fetchSchema, resolveSyncTex,
} from "../../lib/api";
import { sendAITailorRequest, type ChatMessage } from "../../lib/ai-api";
import { extractPageLineCount, projectPdfClickToYamlLine } from "../../lib/synctex-projection";
import { captureError } from "../../lib/error";

const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

// ─── Constants ────────────────────────────────────────────────────────────────
const LOCALE_TABS = [
  { key: "locale_en", label: "EN", title: "English translations" },
  { key: "locale_fr", label: "FR", title: "French translations" },
];

const ACCENT_PRESETS = [
  { color: "#D86F45", label: "Terracotta" },
  { color: "#4F7CBA", label: "Slate Blue" },
  { color: "#6B8F5E", label: "Sage" },
  { color: "#8B5E9E", label: "Mauve" },
  { color: "#C0874A", label: "Amber" },
  { color: "#4A8B7F", label: "Teal" },
  { color: "#B5485A", label: "Crimson" },
  { color: "#2C7A7B", label: "Cyan" },
];

const BASE_PROFILE = "general";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toLabel = (p: string) =>
  p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Settings Dialog ──────────────────────────────────────────────────────────
function SettingsDialog({
  open, onClose, accentColor, onAccentChange,
  aiAlwaysExpanded, onAiAlwaysExpandedChange,
}: {
  open: boolean; onClose: () => void;
  accentColor: string; onAccentChange: (c: string) => void;
  aiAlwaysExpanded: boolean; onAiAlwaysExpandedChange: (v: boolean) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "80vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Settings</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Preferences &amp; subscription</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">

          {/* Appearance & AI */}
          <div className="px-6 py-5 border-b border-gray-50 flex flex-col gap-6">
            
            {/* Accent Color */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">Appearance</span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">Accent colour</p>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_PRESETS.map(({ color, label }) => {
                  const active = accentColor === color;
                  return (
                    <button key={color} onClick={() => onAccentChange(color)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${
                        active ? "shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                      style={active ? { borderColor: color, background: `${color}12` } : {}}>
                      <span className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: color }} />
                      <span className="text-[11px] font-medium text-gray-600 truncate">{label}</span>
                      {active && <Check className="w-3 h-3 ml-auto flex-shrink-0" style={{ color }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Preferences */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">AI Assistant</span>
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-medium text-gray-700">Always expanded</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Keep the AI box fully open by default</p>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${aiAlwaysExpanded ? "bg-[var(--accent)]" : "bg-gray-200"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${aiAlwaysExpanded ? "translate-x-4 shadow-sm" : "translate-x-0.5"}`} />
                </div>
                {/* visually hidden checkbox */}
                <input type="checkbox" className="sr-only" checked={aiAlwaysExpanded} onChange={e => onAiAlwaysExpandedChange(e.target.checked)} />
              </label>
            </div>
            
          </div>

          {/* Subscription */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">Subscription</span>
            </div>
            {/* Free */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Free Plan</p>
                    <p className="text-[10px] text-gray-400">3 variants · PDF export</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Current</span>
              </div>
            </div>
            {/* Pro */}
            <div className="rounded-xl border-2 p-4" style={{ borderColor: accentColor, background: `${accentColor}08` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}>
                    <Crown className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Pro Plan</p>
                    <p className="text-[10px] text-gray-500">Unlimited variants · AI Tailor</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-800">$9<span className="text-[10px] font-normal text-gray-400">/mo</span></span>
                  <button className="text-[11px] font-semibold text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: accentColor }}>
                    Upgrade
                  </button>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {["Unlimited CV variants", "AI-powered tailoring", "All language translations", "Priority PDF rendering"].map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: accentColor }} />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dynamic Island Variant Selector ────────────────────────────────────────────────
function DynamicIslandVariantSelector({
  profiles,
  selected,
  onSelect,
  activeFileType,
  onSetActiveFileType
}: {
  profiles: string[];
  selected: string;
  onSelect: (p: string) => void;
  activeFileType: string;
  onSetActiveFileType: (type: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = profiles.filter(p => p.toLowerCase().includes(query.toLowerCase()));
  const isVariantActive = activeFileType === "variant";
  const isSelectorActive = activeFileType === "selector";

  return (
    <div ref={ref} className="relative pointer-events-auto shadow-lg rounded-full group">
      {/* Unified Split Button */}
      <div className={`flex items-stretch rounded-full border backdrop-blur-md transition-all bg-white/90 ${
        isVariantActive || isSelectorActive || open ? "border-[var(--accent)]" : "border-gray-200"
      }`}>
        
        {/* Dynamic Island Expansion (Selector Button) */}
        <div className={`overflow-hidden transition-[max-width,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center border-r ${
          isSelectorActive 
            ? "max-w-[140px] opacity-100 border-[var(--accent)]/20 bg-[var(--accent)]/10" 
            : "max-w-0 opacity-0 border-transparent group-hover:max-w-[140px] group-hover:opacity-100 group-hover:border-gray-200 hover:bg-gray-50/90"
        }`}>
          <button
            onClick={() => onSetActiveFileType("selector")}
            className={`flex items-center gap-1.5 px-4 h-10 text-xs font-medium whitespace-nowrap rounded-l-full transition-colors ${
              isSelectorActive ? "text-[var(--accent)]" : "text-gray-600"
            }`}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Selector</span>
          </button>
        </div>

        {/* Variant Button (Always Visible) */}
        <button
          onClick={() => onSetActiveFileType("variant")}
          className={`flex items-center gap-1.5 px-4 h-10 text-xs font-medium transition-colors ${
            isVariantActive ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-gray-700 hover:bg-gray-50/90"
          } ${isSelectorActive ? "" : "rounded-l-full group-hover:rounded-l-none transition-[border-radius] duration-300"}`}
        >
          <img src="/logo.png" alt="CVitae Tailor" className="w-4 h-4 object-contain flex-shrink-0" />
          <span className="max-w-[120px] truncate">{toLabel(selected)}</span>
        </button>
        
        {/* Dropdown Chevron */}
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center justify-center px-2 h-10 border-l transition-colors rounded-r-full ${
            open ? "border-[var(--accent)]/20 bg-[var(--accent)]/5 text-[var(--accent)] hover:bg-[var(--accent)]/10" : "border-gray-200 text-gray-500 hover:bg-gray-50/90"
          }`}
        >
          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2 border-b border-gray-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search variants…"
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          {/* Options */}
          <div className="py-1 max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">No variants found</p>
            ) : filtered.map(p => {
              const active = p === selected;
              const isBase = p === BASE_PROFILE;
              return (
                <button key={p} onClick={() => { onSelect(p); onSetActiveFileType("variant"); setOpen(false); setQuery(""); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                    active ? "text-[var(--accent)] bg-orange-50/60" : "text-gray-700"
                  }`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{toLabel(p)}</span>
                    {!isBase && (
                      <span className="text-[10px] text-gray-400 italic">↳ {toLabel(BASE_PROFILE)}</span>
                    )}
                  </div>
                  {active && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Draggable AI Box ──────────────────────────────────────────────────────────
function DraggableAIBox({ 
  alwaysExpanded, 
  yamlContent, 
  onYamlChange 
}: { 
  alwaysExpanded: boolean;
  yamlContent: string;
  onYamlChange: (yaml: string) => void;
}) {
  const t = useTranslations();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 600, h: 360 });
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number; dragged: boolean } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; initW: number; initH: number } | null>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hello! I can help you tailor this CV. Try asking me to \"rewrite the summary to be more management focused\" or \"add a skill section\"."
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBoxExpanded = alwaysExpanded || expanded;

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isBoxExpanded]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userPrompt = input.trim();
    setInput("");
    
    // Add user message
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: userPrompt };
    
    // Add loading status
    const loadingMsg: ChatMessage = { id: "loading", role: "ai", content: "Tailoring CV...", isStatus: true };
    
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const response = await sendAITailorRequest(userPrompt, yamlContent, "Gemini 1.5 Flash");
      
      // Update YAML in editor
      if (response.updatedYaml) {
        onYamlChange(response.updatedYaml);
      }

      // Replace loading msg with actual response
      setMessages(prev => [
        ...prev.filter(m => m.id !== "loading"),
        { id: Date.now().toString(), role: "ai", content: response.reply }
      ]);
    } catch (err) {
      // Handle error gracefully
      setMessages(prev => [
        ...prev.filter(m => m.id !== "loading"),
        { id: Date.now().toString(), role: "ai", content: "Sorry, I encountered an error while tailoring your CV." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".no-drag") || resizeRef.current) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, initX: position.x, initY: position.y, dragged: false };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.dragged = true;
    }
    setPosition({ x: dragRef.current.initX + dx, y: dragRef.current.initY + dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    // Only expand on click if it's currently collapsed
    if (!dragRef.current.dragged && !alwaysExpanded && !expanded) {
      setExpanded(true);
    }
    dragRef.current = null;
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, initW: size.w, initH: size.h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    // When resizing, dx increases width, dy increases height
    setSize({
      w: Math.max(300, resizeRef.current.initW + dx),
      h: Math.max(200, resizeRef.current.initH + dy)
    });
  };

  const handleResizeUp = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    resizeRef.current = null;
  };

  return (
    <div
      className={`absolute z-50 transition-[box-shadow,border-radius,background-color] ${
        isDragging ? "cursor-grabbing duration-0" : "cursor-grab duration-300"
      } ${
        isBoxExpanded 
          ? "shadow-2xl rounded-2xl bg-white" 
          : "w-64 h-12 shadow-lg rounded-full bg-white/95 backdrop-blur-md"
      } border border-gray-200 overflow-hidden flex flex-col`}
      style={{
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
        left: "25%",
        bottom: "24px",
        ...(isBoxExpanded ? { width: `${size.w}px`, height: `${size.h}px` } : {})
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* ─── COLLAPSED VIEW ─── */}
      {!isBoxExpanded && (
        <button
          aria-label={t("AI Tailor")}
          className="flex items-center gap-3 px-5 h-full w-full text-left transition-colors hover:bg-gray-50 flex-shrink-0 focus:outline-none pointer-events-auto"
        >
          <Sparkles className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
          <span className="text-sm font-medium text-gray-500 select-none">{t("AI Tailor")}</span>
        </button>
      )}

      {/* ─── EXPANDED VIEW ─── */}
      {isBoxExpanded && (
        <div className="flex-1 flex flex-col no-drag cursor-auto relative">
          {/* Drag Handle Area (invisible, top 20px) */}
          <div 
            className="absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing z-10"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          
          {/* Header/Collapse Button */}
          {!alwaysExpanded && (
            <button 
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors z-20 no-drag"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin mt-4">
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                
                {/* User Message */}
                {msg.role === "user" && (
                  <div className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl rounded-tr-sm text-[13px] text-gray-700 max-w-[85%] shadow-sm">
                    {msg.content}
                  </div>
                )}

                {/* AI Message / Status */}
                {msg.role === "ai" && (
                  <div className="flex flex-col gap-2">
                    {msg.isStatus ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] font-medium animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        <i>{msg.content}</i>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                        </div>
                        <div className="text-[13px] text-gray-700 leading-relaxed pr-8 whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-3 bg-white flex flex-col gap-2 relative">
            <input
              type="text"
              placeholder="Ask anything..."
              className="w-full text-sm px-3 py-2 bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-3 pb-1">
              {/* Model Selector */}
              <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                Gemini 1.5 Flash
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
                <button className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50" disabled={isLoading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading || !input.trim()}
                  className="w-7 h-7 rounded-full bg-[var(--accent)] hover:opacity-90 flex items-center justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Resize Handle */}
          <div 
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30"
            onPointerDown={handleResizeDown}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeUp}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-300 absolute bottom-1 right-1 pointer-events-none">
              <path d="M21 15L15 21M21 8L8 21" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────
function UserMenu({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative pointer-events-auto">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg border-2 border-white/50"
        title="Account"
      >
        U
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-800">My Account</p>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">user@example.com</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => { onOpenSettings(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-gray-400" />
              Profile settings
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Language Select Dropdown ───────────────────────────────────────────────────
function LanguageSelect({
  locales, selected, onSelect, isActive
}: { locales: {key: string, label: string, title: string}[]; selected: string; onSelect: (k: string) => void; isActive: boolean; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeLabel = locales.find(l => l.key === selected)?.label || "Lang";

  return (
    <div ref={ref} className="relative pointer-events-auto shadow-lg rounded-full" title="Language of the CV to render (Edit translations)">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center justify-between gap-1.5 px-3 h-10 rounded-full text-xs font-medium border backdrop-blur-md transition-all ${
          isActive || open ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-gray-200 bg-white/90 text-gray-500 hover:bg-gray-50/90"
        }`}
      >
        <Languages className="w-4 h-4 flex-shrink-0" />
        <span className="w-6 text-center">{isActive ? activeLabel : "Lang"}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-36 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-1">
            {locales.map(l => (
              <button key={l.key} onClick={() => { onSelect(l.key); setOpen(false); }} title={l.title}
                className={`w-full text-left px-3 py-2 text-xs transition-colors rounded-lg ${
                  l.key === selected && isActive ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}>
                {l.label} Translation
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const t = useTranslations();

  const [profiles, setProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("general");
  const [activeFileType, setActiveFileType] = useState<string>("variant");
  const [yamlContent, setYamlContent] = useState<string>("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [schemaValidated, setSchemaValidated] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("#D86F45");
  const [aiAlwaysExpanded, setAiAlwaysExpanded] = useState(false);

  const editorRef = useRef<any>(null);

  // Sync accent colour to CSS var
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
    document.documentElement.style.setProperty("--accent-hover", accentColor);
  }, [accentColor]);

  useEffect(() => {
    fetchProfiles()
      .then(p => {
        setProfiles(p);
        if (p.length > 0 && !p.includes("general")) setSelectedProfile(p[0]);
      })
      .catch(() => setErrorMsg("Could not load profiles. Is the backend running?"));
  }, []);

  useEffect(() => {
    if (!selectedProfile) return;
    fetchFileContent(selectedProfile, activeFileType)
      .then(data => {
        setYamlContent(data.content);
        try { parseYaml(data.content); setSchemaValidated(true); }
        catch { setSchemaValidated(false); }
      })
      .catch(() => setErrorMsg("Could not load file content."));
  }, [selectedProfile, activeFileType]);

  useEffect(() => {
    const t = activeFileType === "selector" ? "selector" : "variant";
    fetchSchema(t).then(() => setSchemaValidated(true)).catch(() => setSchemaValidated(false));
  }, [activeFileType]);

  const handleEditorDidMount = (ed: any) => { editorRef.current = ed; };
  const handleYamlChange = (v: string | undefined) => setYamlContent(v || "");

  const renderMutation = useMutation({
    mutationFn: (content: string) => generatePDF(content),
    onSuccess: blob => { setErrorMsg(null); setPdfBlob(blob); },
    onError: (error: any) => {
      console.error("Render failed:", error);
      captureError(error);
      setErrorMsg("The server encountered a problem compiling your PDF. Please try again later.");
    },
  });

  const handlePdfClick = async (page: number, x: number, y: number, yFraction?: number, pdfDoc?: any) => {
    try {
      let targetLine: number | null = null;
      if (pdfDoc && typeof yFraction === "number") {
        try {
          const counts: number[] = [];
          for (let p = 1; p <= (pdfDoc.numPages || 1); p++)
            counts.push(await extractPageLineCount(await pdfDoc.getPage(p)));
          const proj = projectPdfClickToYamlLine({ clickedPage: page, yFraction, pageLineCounts: counts, totalYamlLines: yamlContent.split("\n").length });
          if (proj.confidence > 0 && proj.targetLine > 0) targetLine = proj.targetLine;
        } catch { /* fall through */ }
      }
      if (!targetLine) {
        const r = await resolveSyncTex(page, x, y);
        if (r.tex_line > 0) {
          const lines = yamlContent.split("\n");
          targetLine = Math.min(lines.length, Math.max(1, Math.round((r.tex_line / Math.max(1, lines.length)) * lines.length)));
        }
      }
      if (targetLine && editorRef.current) {
        editorRef.current.revealLineInCenter(targetLine);
        editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
        editorRef.current.focus();
      }
    } catch { /* silent */ }
  };

  const variantTabs = [
    { key: "selector", label: "Selector", title: "Selector — choose which sections to include", icon: <CheckCircle className="w-3 h-3" /> },
    ...LOCALE_TABS.map(l => ({ ...l, icon: <Languages className="w-3 h-3" /> })),
  ];

  return (
    <div className="h-screen w-full relative bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden">
      <h1 className="sr-only">{t("CVitae Tailor")}</h1>
      
      {/* ═══════════════════════ WORKSPACE (Background) ════════════════════ */}
      <div className="absolute inset-0 z-0">
        <PanelGroup direction="horizontal" className="h-full">

          <Panel defaultSize={55} minSize={30} className="flex flex-col h-full relative">
            <span className="sr-only">{t("Variant Configuration")}</span>
            <Editor
              height="100%"
              defaultLanguage={activeFileType.startsWith("locale_") ? "json" : "yaml"}
              language={activeFileType.startsWith("locale_") ? "json" : "yaml"}
              value={yamlContent}
              onChange={handleYamlChange}
              onMount={handleEditorDidMount}
              theme="light"
              options={{ minimap: { enabled: false }, fontSize: 13, lineHeight: 24, padding: { top: 72 }, scrollBeyondLastLine: false, smoothScrolling: true, cursorBlinking: "smooth" }}
            />
          </Panel>

          <PanelResizeHandle className="w-px bg-[var(--border)] hover:bg-[var(--accent)] hover:w-1 transition-all cursor-col-resize z-10" />

          <Panel defaultSize={45} minSize={25} className="flex flex-col h-full bg-[#ECEAE6] relative z-0">
            <span className="sr-only">{t("Live Preview")}</span>
            {pdfBlob ? (
              <PDFViewer pdfBlob={pdfBlob} onPdfClick={handlePdfClick} />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 gap-3 h-full">
                <Eye className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">{t("Click \"Render PDF\" to generate preview")}</p>
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>

      {/* ═══════════════════════ FLOATING CONTROLS OVERLAY ════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-20 flex justify-between items-start p-4">
        
        {/* Left Side Controls */}
        <div className="flex items-center gap-3">
          {/* Dynamic Island Unified Button (Selector + Variant) */}
          <DynamicIslandVariantSelector
            profiles={profiles}
            selected={selectedProfile}
            onSelect={setSelectedProfile}
            activeFileType={activeFileType}
            onSetActiveFileType={setActiveFileType}
          />

          {/* Language Dropdown */}
          <LanguageSelect 
            locales={LOCALE_TABS}
            selected={activeFileType.startsWith("locale_") ? activeFileType : "locale_en"}
            onSelect={setActiveFileType}
            isActive={activeFileType.startsWith("locale_")}
          />
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => renderMutation.mutate(yamlContent)}
            disabled={renderMutation.isPending}
            className="h-10 flex items-center gap-2 bg-[var(--accent)] text-white px-5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg pointer-events-auto disabled:opacity-50"
          >
            {renderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {renderMutation.isPending ? t("Rendering") : t("Render PDF")}
          </button>

          <UserMenu onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </div>

      {/* Floating Draggable AI */}
      <DraggableAIBox 
        alwaysExpanded={aiAlwaysExpanded} 
        yamlContent={yamlContent} 
        onYamlChange={setYamlContent} 
      />

      {/* ═══════════════════════ ERROR TOAST ═══════════════════════════════ */}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-50/95 border border-red-200 text-red-900 px-4 py-3 rounded-xl shadow-xl backdrop-blur-md max-w-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">System Alert</span>
            <span className="text-xs leading-normal font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700 transition-colors shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════ SETTINGS DIALOG ═══════════════════════════ */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        accentColor={accentColor}
        onAccentChange={setAccentColor}
        aiAlwaysExpanded={aiAlwaysExpanded}
        onAiAlwaysExpandedChange={setAiAlwaysExpanded}
      />
    </div>
  );
}
