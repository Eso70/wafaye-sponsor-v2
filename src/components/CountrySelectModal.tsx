"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaMagnifyingGlass } from "react-icons/fa6";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/country-codes";

export type CountrySelectModalProps = {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  compact?: boolean;
};

function getCountryLabel(code: string): string {
  const c = COUNTRY_CODES.find((x) => x.code === code);
  return c ? `+${c.code} ${c.name}` : `+${code}`;
}

export function CountrySelectModal({
  value,
  onChange,
  placeholder = "Select country",
  compact = false,
}: CountrySelectModalProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.trim().toLowerCase();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        `+${c.code}`.includes(q)
    );
  }, [search]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open]);

  const displayValue = value ? getCountryLabel(value) : placeholder;
  const selectedCode = value || DEFAULT_COUNTRY_CODE;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2.5 text-left text-sm transition focus:border-[#1b49d0] focus:outline-none focus:ring-2 focus:ring-[#c8d6ff] ${
          open
            ? "border-[#1f5ce0] ring-2 ring-[#c8d6ff]/50"
            : "hover:border-slate-400"
        }`}
      >
        <span className={`font-medium text-slate-800 ${compact ? "text-xs" : ""}`}>
          {displayValue}
        </span>
        <FaChevronDown className={`text-xs text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4"
          onClick={() => setOpen(false)}
          aria-hidden
        >
          <div
            className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-[#d7e2f8] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#e8eef8] bg-gradient-to-r from-[#f8fbff] to-[#f5f9ff] px-4 py-3">
              <div className="relative flex items-center gap-2">
                <FaMagnifyingGlass className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1f5ce0] focus:ring-2 focus:ring-[#c8d6ff]/50"
                />
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No countries match &quot;{search}&quot;
                </div>
              ) : (
                <div className="py-2">
                  {filtered.map((c) => {
                    const isSelected = c.code === selectedCode;
                    return (
                      <button
                        key={`${c.code}-${c.name}`}
                        type="button"
                        onClick={() => {
                          onChange(c.code);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                          isSelected
                            ? "bg-[#e8efff] text-[#1a43b6] font-medium"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="w-12 shrink-0 font-mono text-slate-500">+{c.code}</span>
                        <span className="flex-1">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex border-t border-[#e8eef8] bg-[#f8fbff] px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
