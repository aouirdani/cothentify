"use client";

import { Menu } from "@headlessui/react";
import { useEffect, useState } from "react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
] as const;

export default function LanguageButton() {
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) || "en";
    setLang(saved);
    if (typeof document !== "undefined") document.documentElement.lang = saved;
  }, []);

  function choose(code: string) {
    setLang(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", code);
      if (typeof document !== "undefined") document.documentElement.lang = code;
    }
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50">
          {lang.toUpperCase()}
          <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </Menu.Button>
      </div>
      <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md border border-slate-200 bg-white shadow-lg focus:outline-none z-20">
        <div className="py-1">
          {LANGS.map((l) => (
            <Menu.Item key={l.code}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => choose(l.code)}
                  className={`block w-full px-3 py-2 text-left text-sm ${active ? "bg-slate-100" : ""}`}
                >
                  {l.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}

