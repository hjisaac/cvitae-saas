"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, X, ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { sendAITailorRequest, type ChatMessage } from "../lib/ai-api";

interface DraggableAIBoxProps {
  alwaysExpanded: boolean;
  yamlContent: string;
  onYamlChange: (yaml: string) => void;
}

export function DraggableAIBox({
  alwaysExpanded,
  yamlContent,
  onYamlChange
}: DraggableAIBoxProps) {
  const t = useTranslations();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 600, h: 360 });
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number; dragged: boolean } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; initW: number; initH: number } | null>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBoxExpanded = alwaysExpanded || expanded;

  // Initialize welcome message dynamically to use t()
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "ai",
        content: t("Hello! I can help you tailor this CV; Try asking me to \"rewrite the summary to be more management focused\" or \"add a skill section\"")
      }
    ]);
  }, [t]);

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
    const loadingMsg: ChatMessage = { id: "loading", role: "ai", content: t("Tailoring CV"), isStatus: true };

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
        { id: Date.now().toString(), role: "ai", content: t("Sorry, I encountered an error while tailoring your CV") }
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
          ? "shadow-2xl rounded-2xl bg-white animate-in zoom-in-95 duration-200" 
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
          <Sparkles className="w-4 h-4 text-[var(--accent)] flex-shrink-0 animate-pulse" />
          <span className="text-sm font-medium text-gray-500 select-none">{t("AI Tailor")}</span>
        </button>
      )}

      {/* ─── EXPANDED VIEW ─── */}
      {isBoxExpanded && (
        <div className="flex-1 flex flex-col no-drag cursor-auto relative">
          {/* Drag Handle Area */}
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
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
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
          <div className="border-t border-gray-100 p-3 bg-white flex flex-col gap-2 relative flex-shrink-0">
            <input
              type="text"
              placeholder={t("Ask anything")}
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
