"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Database, Trash2, Layers, Type, Sun, Moon } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  onClearChat?: () => void;
  title: string;
  subtitle: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type TextSize = "75" | "90" | "100" | "125" | "140";
type ThemeMode = "light" | "dark";

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onClearChat,
  title,
  subtitle,
}) => {
  const pathname = usePathname();
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const [textSize, setTextSize] = useState<TextSize>("125"); // Default 125% for 4K 27"
  const [theme, setTheme] = useState<ThemeMode>("light"); // Default to clean white/light theme for presentation

  useEffect(() => {
    // Read theme preference or default to light
    const savedTheme = (localStorage.getItem("preferred_theme") as ThemeMode) || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Read font size preference or default to 125% for 4K
    const savedSize = localStorage.getItem("preferred_text_size");
    let initialSize: TextSize = "125";
    if (savedSize === "75" || savedSize === "90" || savedSize === "100" || savedSize === "125" || savedSize === "140") {
      initialSize = savedSize;
    } else if (savedSize === "normal") {
      initialSize = "100";
    } else if (savedSize === "large") {
      initialSize = "125";
    } else if (savedSize === "xlarge") {
      initialSize = "140";
    }

    setTextSize(initialSize);
    document.documentElement.setAttribute("data-text-size", initialSize);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("preferred_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const changeTextSize = (size: TextSize) => {
    setTextSize(size);
    localStorage.setItem("preferred_text_size", size);
    document.documentElement.setAttribute("data-text-size", size);
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/readyz`);
        if (res.ok) {
          const data = await res.json();
          setBackendReady(data.status === "ready");
        } else {
          setBackendReady(false);
        }
      } catch (_) {
        setBackendReady(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isRouting = pathname === "/" || pathname === "/routing";
  const isRAG = pathname === "/rag";

  const sizeOptions: { id: TextSize; label: string; tooltip: string }[] = [
    { id: "75", label: "75%", tooltip: "Compact (75%)" },
    { id: "90", label: "90%", tooltip: "Medium Compact (90%)" },
    { id: "100", label: "100%", tooltip: "Standard (100%)" },
    { id: "125", label: "125%", tooltip: "Recommended for 4K 27-inch (125%)" },
    { id: "140", label: "140%", tooltip: "Extra Large (140%)" },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/20 transition-colors duration-150">
      {/* Top Navbar */}
      <header className="h-16 2xl:h-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 2xl:w-11 2xl:h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Layers className="w-5 h-5 2xl:w-6 2xl:h-6" />
          </div>
          <div>
            <span className="font-bold text-base 2xl:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
              ◈ Bedrock Lab
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl text-sm 2xl:text-base font-medium">
          <Link
            href="/routing"
            className={`flex items-center gap-2 px-3.5 2xl:px-5 py-1.5 2xl:py-2 rounded-lg transition-all ${
              isRouting
                ? "bg-blue-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Cpu className="w-4 h-4 2xl:w-5 2xl:h-5" />
            <span>Routing</span>
          </Link>

          <Link
            href="/rag"
            className={`flex items-center gap-2 px-3.5 2xl:px-5 py-1.5 2xl:py-2 rounded-lg transition-all ${
              isRAG
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Database className="w-4 h-4 2xl:w-5 2xl:h-5" />
            <span>RAG Chat</span>
          </Link>
        </nav>

        {/* Actions & Text Size & Theme & Status */}
        <div className="flex items-center gap-2.5 2xl:gap-3.5">
          {/* Font Size Switcher with 75%, 90%, 100%, 125%, 140% */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs">
            <span className="text-slate-400 px-1.5 flex items-center gap-1" title="Adjust font size">
              <Type className="w-3.5 h-3.5" />
            </span>
            {sizeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => changeTextSize(opt.id)}
                className={`px-2 py-0.5 rounded transition-all text-[11px] 2xl:text-xs font-mono ${
                  textSize === opt.id
                    ? "bg-blue-600 text-white dark:bg-cyan-600/30 dark:text-cyan-300 font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title={opt.tooltip}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Theme Mode Toggle (Sun for presentation / Moon for dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all text-xs"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode (Presentation)"}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {onClearChat && (
            <button
              type="button"
              onClick={onClearChat}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all text-xs 2xl:text-sm flex items-center gap-1.5"
              title="Clear messages"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Clear</span>
            </button>
          )}

          {/* AWS Bedrock connection indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs 2xl:text-sm font-mono border ${
              backendReady === true
                ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : backendReady === false
                ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendReady === true
                  ? "bg-emerald-500 animate-pulse"
                  : backendReady === false
                  ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
            />
            <span className="hidden lg:inline font-medium">
              {backendReady === true ? "AWS Bedrock Online" : backendReady === false ? "Local / Standby" : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      {/* Page Title Sub-bar */}
      <div className="bg-slate-100/90 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 py-2.5 flex items-center justify-between text-xs 2xl:text-sm text-slate-600 dark:text-slate-400">
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-200">{title}</span>
          <span className="mx-2 text-slate-400">—</span>
          <span className="text-slate-600 dark:text-slate-400">{subtitle}</span>
        </div>
      </div>

      {/* Main Content Viewport: widened for 4K / large screens */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl xl:max-w-5xl 2xl:max-w-6xl w-full mx-auto p-3 md:p-6">
        {children}
      </main>
    </div>
  );
};
