"use client";

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

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    setLang(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", code);
      if (typeof document !== "undefined") document.documentElement.lang = code;
    }
  }

  return (
    <label className="inline-flex items-center gap-1 text-sm text-slate-600" aria-label="Choose language">
      <select
        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        value={lang}
        onChange={onChange}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
