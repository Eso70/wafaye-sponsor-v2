"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { FaRegCalendarAlt } from "react-icons/fa";

function useHoldToRepeat(action: () => void, enabled: boolean) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);
  const actionRef = useRef(action);
  actionRef.current = action;

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stepRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;
    actionRef.current();
    stepRef.current = 0;
    timeoutRef.current = setTimeout(function schedule() {
      timeoutRef.current = null;
      if (!enabled) return;
      actionRef.current();
      stepRef.current += 1;
      const delay = Math.max(55, 380 - stepRef.current * 28);
      timeoutRef.current = setTimeout(schedule, delay);
    }, 420);
  }, [enabled]);

  useEffect(() => {
    const stop = () => clear();
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      clear();
    };
  }, [clear]);

  return { onPointerDown: start, onPointerUp: clear, onPointerLeave: clear };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_HEADER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatExpireDate(value: string): string {
  if (!value) return "Select date";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return "Select date";
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export type ExpireDatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
};

export function ExpireDatePicker({
  value,
  onChange,
  label = "Expire date",
  minYear,
  maxYear,
  disabled = false,
}: ExpireDatePickerProps) {
  const today = new Date();
  const defaultMinYear = today.getFullYear();
  const defaultMaxYear = 2100;
  const min = minYear ?? defaultMinYear;
  const max = maxYear ?? defaultMaxYear;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function parseValue(val: string) {
    if (!val) return { year: today.getFullYear() + 1, month: 11, day: 31 };
    const [y, m, d] = val.split("-").map(Number);
    return { year: y || today.getFullYear() + 1, month: m ? m - 1 : 11, day: d || 31 };
  }

  const [pending, setPending] = useState(() => parseValue(value));
  const [viewYear, setViewYear] = useState(() => parseValue(value).year);
  const [viewMonth, setViewMonth] = useState(() => parseValue(value).month);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const YEAR_GRID_SIZE = 12;
  const yearBlockStart = Math.floor((viewYear - min) / YEAR_GRID_SIZE) * YEAR_GRID_SIZE + min;
  const yearGridYears = Array.from(
    { length: Math.min(YEAR_GRID_SIZE, max - yearBlockStart + 1) },
    (_, i) => yearBlockStart + i
  );

  useEffect(() => {
    if (open) {
      setPending(parseValue(value));
      setViewYear(parseValue(value).year);
      setViewMonth(parseValue(value).month);
    }
  }, [open, value]);

  const selectedDate = pending;

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
      if (yearPickerOpen && !(e.target as HTMLElement).closest("[data-year-picker], [data-year-trigger]")) setYearPickerOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (yearPickerOpen) setYearPickerOpen(false);
        else setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [yearPickerOpen]);

  function goPrevMonth() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goNextMonth() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  function selectDate(year: number, month: number, day: number) {
    setPending({ year, month, day });
  }

  function handleSubmit() {
    const dateStr = `${pending.year}-${String(pending.month + 1).padStart(2, "0")}-${String(pending.day).padStart(2, "0")}`;
    onChange(dateStr);
    setOpen(false);
  }

  function handleCancel() {
    setOpen(false);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  type Cell = { day: number; isCurrentMonth: boolean; isPrevMonth: boolean; isNextMonth: boolean };

  const cells: Cell[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({
      day: prevMonthDays - firstDay + i + 1,
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, isPrevMonth: false, isNextMonth: false });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, isCurrentMonth: false, isPrevMonth: false, isNextMonth: true });
  }

  const canGoPrev = viewYear > min || viewMonth > 0;
  const canGoNext = viewYear < max || viewMonth < 11;

  const holdPrev = useHoldToRepeat(goPrevMonth, canGoPrev);
  const holdNext = useHoldToRepeat(goNextMonth, canGoNext);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className={`flex w-full items-center gap-3 rounded-full border px-4 py-2.5 text-left text-sm transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
            : open
              ? "border-[#1f5ce0] bg-white ring-2 ring-[#c8d6ff]/50"
              : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8efff] text-[#1f5ce0]">
          <FaRegCalendarAlt className="text-sm" />
        </span>
        <span className="flex-1 font-medium text-slate-800">{formatExpireDate(value)}</span>
        <FaChevronDown className={`text-xs text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4"
            onClick={() => setOpen(false)}
            aria-hidden
          >
            <div
              className="w-full max-w-[320px] overflow-hidden rounded-2xl border border-[#d7e2f8] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
          <div className="relative border-b border-[#e8eef8] bg-gradient-to-r from-[#f8fbff] to-[#f5f9ff] px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                disabled={!canGoPrev}
                {...holdPrev}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/80 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed select-none"
                aria-label="Previous month"
              >
                <FaChevronLeft className="text-sm" />
              </button>
              <button
                data-year-trigger
                type="button"
                onClick={() => setYearPickerOpen((p) => !p)}
                className="rounded-lg px-3 py-1.5 text-base font-bold text-slate-800 transition hover:bg-white/80"
              >
                {viewYear}
              </button>
              <button
                type="button"
                onClick={goNextMonth}
                disabled={!canGoNext}
                {...holdNext}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/80 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed select-none"
                aria-label="Next month"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
            {yearPickerOpen ? (
              <div
                data-year-picker
                className="absolute left-1/2 top-full z-10 mt-1 w-[200px] -translate-x-1/2 rounded-xl border border-[#d7e2f8] bg-white p-2 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => Math.max(min, y - YEAR_GRID_SIZE))}
                    disabled={yearBlockStart <= min}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <FaChevronLeft className="text-[10px]" />
                  </button>
                  <span className="text-[10px] font-medium text-slate-500">{yearBlockStart}–{yearBlockStart + YEAR_GRID_SIZE - 1}</span>
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => Math.min(max, y + YEAR_GRID_SIZE))}
                    disabled={yearBlockStart + YEAR_GRID_SIZE - 1 >= max}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <FaChevronRight className="text-[10px]" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-0.5">
                  {yearGridYears.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        setYearPickerOpen(false);
                      }}
                      className={`rounded py-1.5 text-xs font-medium transition ${
                        viewYear === y ? "bg-[#1f5ce0] text-white" : "hover:bg-slate-100"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {DAYS_HEADER.map((d) => (
                <div
                  key={d}
                  className="py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  {d}
                </div>
              ))}
              {cells.map((cell, idx) => {
                const cellYear = cell.isPrevMonth
                  ? viewMonth === 0 ? viewYear - 1 : viewYear
                  : cell.isNextMonth
                    ? viewMonth === 11 ? viewYear + 1 : viewYear
                    : viewYear;
                const cellMonth = cell.isPrevMonth
                  ? viewMonth === 0 ? 11 : viewMonth - 1
                  : cell.isNextMonth
                    ? viewMonth === 11 ? 0 : viewMonth + 1
                    : viewMonth;
                const isSelected =
                  selectedDate &&
                  selectedDate.year === cellYear &&
                  selectedDate.month === cellMonth &&
                  selectedDate.day === cell.day;
                const isToday =
                  cell.isCurrentMonth &&
                  today.getFullYear() === viewYear &&
                  today.getMonth() === viewMonth &&
                  today.getDate() === cell.day;
                const isOtherMonth = !cell.isCurrentMonth;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        selectDate(viewYear, viewMonth, cell.day);
                      } else if (cell.isPrevMonth) {
                        const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
                        const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
                        selectDate(prevY, prevM, cell.day);
                      } else if (cell.isNextMonth) {
                        const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
                        const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
                        selectDate(nextY, nextM, cell.day);
                      }
                    }}
                    className={`
                      flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition
                      cursor-pointer
                      ${
                        isSelected
                          ? "bg-[#1f5ce0] text-white shadow-sm"
                          : isToday
                            ? "bg-[#e8efff] text-[#1a43b6] font-semibold"
                            : isOtherMonth
                              ? "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                              : "text-slate-700 hover:bg-slate-100"
                      }
                    `}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-[#e8eef8] bg-[#f8fbff] px-4 py-3">
            {[
              { label: "6 months", months: 6 },
              { label: "1 year", months: 12 },
              { label: "2 years", months: 24 },
            ].map((preset) => {
              const d = new Date(today);
              d.setMonth(d.getMonth() + preset.months);
              const y = d.getFullYear();
              const m = d.getMonth();
              const lastDay = getDaysInMonth(y, m);
              const isActive =
                pending.year === y && pending.month === m && pending.day === lastDay;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPending({ year: y, month: m, day: lastDay })}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    isActive
                      ? "border border-[#1f5ce0] bg-[#e8efff] text-[#1a43b6]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 border-t border-[#e8eef8] px-4 py-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 rounded-full border border-[#1f5ce0] bg-[#1f5ce0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a4fc9]"
            >
              Submit
            </button>
          </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
