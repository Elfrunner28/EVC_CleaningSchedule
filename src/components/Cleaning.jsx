"use client";

import React, { useMemo, useState, useEffect } from "react";

/**
 * Fall 2025 Cleaning Schedule – Simple Daily Web App
 * --------------------------------------------------
 * • Shows all tasks for any chosen date between Aug 26, 2025 and Dec 5, 2025
 * • Rotation rules (per user):
 *   - Trash: 1 person per week, rotates A→G
 *   - Vacuum: 1 person per week, rotates A→G
 *   - Bathroom & Shower: 1 per group per week
 *       Group 1 (4 ppl): A,B,C,D → rotates weekly
 *       Group 2 (3 ppl): E,F,G → rotates weekly
 *   - Living Room & Table: every other day across ALL members A→G (no sink duty)
 *
 * People order A..G -> ["Leo","Phil","Karti","Andrew","Eli","Mitchell","Hall"]
 */

// ---- Constants ----
const NAMES = ["Leo", "Phil", "Karti", "Andrew", "Eli", "Mitchell", "Hall"]; // A..G
const START_DATE = new Date("2025-08-26T00:00:00"); // inclusive
const END_DATE = new Date("2025-12-05T23:59:59"); // inclusive

// Groups: indices into NAMES
const GROUP1 = [0, 1, 2, 3]; // A-D -> Leo, Phil, Karti, Andrew
const GROUP2 = [4, 5, 6]; // E-G -> Eli, Mitchell, Hall

// Utility helpers
function clampDate(d) {
  if (d < START_DATE) return new Date(START_DATE);
  if (d > END_DATE) return new Date(END_DATE);
  return d;
}

function toDateInputValue(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromDateInputValue(v) {
  // Treat as local date
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a, b) {
  // floor difference in whole days
  const MS = 24 * 60 * 60 * 1000;
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((bUTC - aUTC) / MS);
}

function weekIndexFor(date) {
  // Week 0 starts on START_DATE, increments every 7 days
  const diff = daysBetween(START_DATE, date);
  return Math.floor(diff / 7);
}

function personByIndex(i) {
  return NAMES[i % NAMES.length];
}

// Compute assignments for a given date
function assignmentsFor(date) {
  if (date < START_DATE || date > END_DATE) return null;
  const w = weekIndexFor(date);

  // Trash & Vacuum rotate weekly through A..G
  const trashIdx = w % NAMES.length;
  const vacuumIdx = (w + 3) % NAMES.length; // staggered so Trash and Vacuum are different people

  // Bathroom & Shower rotate weekly within their groups
  const bath1Idx = GROUP1[w % GROUP1.length];
  const bath2Idx = GROUP2[w % GROUP2.length];

  // Living Room & Table: every other day sequence starting START_DATE
  const dayOffset = daysBetween(START_DATE, date);
  let living = null;
  if (dayOffset % 2 === 0) {
    const livingTurns = Math.floor(dayOffset / 2); // 0,1,2,...
    const livingIdx = livingTurns % NAMES.length;
    living = NAMES[livingIdx];
  }

  return {
    trash: NAMES[trashIdx],
    vacuum: NAMES[vacuumIdx],
    bathroomGroup1: NAMES[bath1Idx],
    bathroomGroup2: NAMES[bath2Idx],
    livingRoom: living, // may be null on off-days
  };
}

// Small presentational helpers
function Card({ title, children }) {
  return (
    <div className="rounded-2xl shadow p-4 bg-white border border-gray-100">
      <div className="text-sm font-semibold text-gray-500 mb-1">{title}</div>
      <div className="text-lg">{children}</div>
    </div>
  );
}

function Pill({ text }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-sm border border-gray-300">
      {text}
    </span>
  );
}

export default function CleaningScheduleApp() {
  // Default to today, clamped into semester range
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return clampDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate())
    );
  });

  // keep selectedDate inside bounds if user moves system clock
  useEffect(() => {
    setSelectedDate((d) => clampDate(d));
  }, []);

  const data = useMemo(() => assignmentsFor(selectedDate), [selectedDate]);

  const minStr = toDateInputValue(START_DATE);
  const maxStr = toDateInputValue(END_DATE);
  const valStr = toDateInputValue(selectedDate);

  const canPrev = selectedDate > START_DATE;
  const canNext = selectedDate < END_DATE;

  function shiftDay(delta) {
    setSelectedDate((d) =>
      clampDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta))
    );
  }

  function jumpToToday() {
    const today = clampDate(new Date());
    setSelectedDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate())
    );
  }

  const weekday = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
  });
  const niceDate = selectedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Fall 2025 Cleaning Schedule</h1>
          <p className="text-sm text-gray-600 mt-1">
            Aug 26, 2025 → Dec 5, 2025
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-3 items-end mb-6">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">
              Pick a date
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-gray-300 p-2"
              min={minStr}
              max={maxStr}
              value={valStr}
              onChange={(e) =>
                setSelectedDate(fromDateInputValue(e.target.value))
              }
            />
          </div>
          <div className="flex gap-2 md:justify-end">
            <button
              className={`rounded-xl px-3 py-2 border ${
                canPrev ? "border-gray-300" : "border-gray-200 text-gray-300"
              }`}
              onClick={() => shiftDay(-1)}
              disabled={!canPrev}
            >
              ◀ Prev
            </button>
            <button
              className="rounded-xl px-3 py-2 border border-gray-300"
              onClick={jumpToToday}
            >
              Today
            </button>
            <button
              className={`rounded-xl px-3 py-2 border ${
                canNext ? "border-gray-300" : "border-gray-200 text-gray-300"
              }`}
              onClick={() => shiftDay(1)}
              disabled={!canNext}
            >
              Next ▶
            </button>
          </div>
        </div>

        <section className="mb-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-semibold">Assignments</h2>
            <Pill text={`${weekday}, ${niceDate}`} />
          </div>
        </section>

        {data ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Card title="🗑 Trash (weekly)">{data.trash}</Card>
            <Card title="🧹 Vacuum (weekly)">{data.vacuum}</Card>
            <Card title="🚿 Bathroom + Shower – Group 1 (Leo, Phil, Karti, Andrew)">
              {data.bathroomGroup1}
            </Card>
            <Card title="🚿 Bathroom + Shower – Group 2 (Eli, Mitchell, Hall)">
              {data.bathroomGroup2}
            </Card>
            <div className="sm:col-span-2">
              <Card title="🛋 Living Room + Table (every other day)">
                {data.livingRoom ? (
                  <span>{data.livingRoom}</span>
                ) : (
                  <span className="text-gray-500">
                    No living room/table duty today
                  </span>
                )}
              </Card>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Selected date is outside the Fall 2025 semester. Please choose a
            date between Aug 26 and Dec 5, 2025.
          </div>
        )}

        <footer className="mt-8 text-sm text-gray-500">
          <div className="mb-2 font-medium">Members:</div>
          <div className="flex flex-wrap gap-2">
            {NAMES.map((n, i) => (
              <Pill key={i} text={n} />
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
