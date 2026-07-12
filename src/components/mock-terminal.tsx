"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

export default function MockTerminal() {
  const [copied, setCopied] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [stage, setStage] = useState(0); // 0: typing, 1: system outputs, 2: table, 3: completed, 4: pause before reset
  
  const fullCommand = "matrix db --query=upcoming";
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (stage === 0) {
      // Stage 0: Type the command
      if (typedText.length < fullCommand.length) {
        timer = setTimeout(() => {
          setTypedText(fullCommand.slice(0, typedText.length + 1));
        }, 80 + Math.random() * 40); // natural typing speed
      } else {
        // Typing done, move to next stage after short pause
        timer = setTimeout(() => {
          setStage(1);
        }, 600);
      }
    } else if (stage === 1) {
      // Stage 1: Fast output text
      timer = setTimeout(() => {
        setStage(2);
      }, 800);
    } else if (stage === 2) {
      // Stage 2: Output table/final results
      timer = setTimeout(() => {
        setStage(3);
      }, 1500);
    } else if (stage === 3) {
      // Stage 3: Finished, wait before reset
      timer = setTimeout(() => {
        setStage(4);
      }, 6000);
    } else if (stage === 4) {
      // Reset
      setTypedText("");
      setStage(0);
    }
    
    return () => clearTimeout(timer);
  }, [typedText, stage]);

  const copyCommand = () => {
    navigator.clipboard.writeText("npx matrix-cli init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full relative group">
      {/* Glow effect behind terminal */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00F5D4] to-cyan-500 rounded-lg blur-lg opacity-20 group-hover:opacity-35 transition duration-1000 group-hover:duration-200" />
      
      {/* Terminal Container */}
      <div className="relative w-full rounded-lg border border-white/[0.08] bg-[#0c0b11] text-left font-mono text-[12px] leading-relaxed text-[#eeeef0] shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#121118]/80 backdrop-blur">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            <span className="ml-3 font-sans text-xs font-medium text-muted-foreground">matrix-shell</span>
          </div>
          
          <button 
            onClick={copyCommand}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-sans text-muted-foreground hover:text-foreground hover:bg-white/5 rounded transition-all"
            title="Copy command"
          >
            {copied ? (
              <>
                <Check size={11} className="text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>npx matrix-cli</span>
              </>
            )}
          </button>
        </div>

        {/* Terminal Content */}
        <div className="p-5 min-h-[250px] flex flex-col justify-between font-mono bg-[#0c0b11]/90">
          <div>
            {/* Command Input line */}
            <div className="flex items-center text-[#00F5D4]">
              <span className="text-cyan-400 mr-2">▲</span>
              <span className="text-[#00F5D4] mr-2">matrix</span>
              <span className="text-white/70 mr-2">$</span>
              <span className="text-white font-semibold">
                {typedText}
                {stage === 0 && <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#00F5D4] caret-blink align-middle" />}
              </span>
            </div>

            {/* Connecting logs */}
            {stage >= 1 && (
              <div className="mt-3 space-y-1 text-muted-foreground text-[11px]">
                <div className="text-white/60">
                  <span className="text-[#00F5D4] mr-1.5">⚡</span> Connecting to Matrix Event Database...
                </div>
                <div className="text-white/60">
                  <span className="text-[#00F5D4] mr-1.5">✔</span> Connection established. Querying upcoming events.
                </div>
              </div>
            )}

            {/* Event Output Grid */}
            {stage >= 2 && (
              <div className="mt-5 border border-white/[0.05] rounded overflow-hidden animate-fade-in bg-white/[0.01]">
                <div className="grid grid-cols-12 gap-2 bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#9a99a8] border-b border-white/[0.05]">
                  <div className="col-span-6">Event Name</div>
                  <div className="col-span-3">Category</div>
                  <div className="col-span-3 text-right">Date</div>
                </div>
                <div className="divide-y divide-white/[0.03] text-[11px]">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-6 text-[#00F5D4] font-medium truncate">Transformer Architectures</div>
                    <div className="col-span-3 text-cyan-400">Workshop</div>
                    <div className="col-span-3 text-right text-white/70">Oct 12</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-6 text-[#00F5D4] font-medium truncate">Build Sprint 2026</div>
                    <div className="col-span-3 text-cyan-400">Hackathon</div>
                    <div className="col-span-3 text-right text-white/70">Nov 05</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-6 text-[#00F5D4] font-medium truncate">AIML Paper Presentations</div>
                    <div className="col-span-3 text-cyan-400">Symposium</div>
                    <div className="col-span-3 text-right text-white/70">Nov 18</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer CLI State */}
          <div className="mt-6 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Ready
              </span>
              <span>v1.2.0</span>
            </div>
            <div>
              <span>AIML · Karunya University</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
