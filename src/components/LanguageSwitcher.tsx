"use client";

import { useLanguage } from "./LanguageContext";

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center bg-surface-2 border border-border rounded-lg p-0.5 shadow-sm">
            <button
                onClick={() => setLanguage("zh")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${language === "zh"
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
            >
                中
            </button>
            <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${language === "en"
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
            >
                EN
            </button>
        </div>
    );
}
