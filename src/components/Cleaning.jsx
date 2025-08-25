"use client";

import React, { useMemo, useState, useEffect } from "react";

/**
 * Fall 2025 Cleaning Schedule – Simple Daily Web App
 * --------------------------------------------------
 * • Shows all tasks for any chosen date between Aug 26, 2025 and Dec 5, 2025
 * • Rotation rules (per user):
 *   - Trash: 1 person per week, rotates among all 7
 *   - Vacuum: 1 person per week, rotates among all 7 (independent of Trash)
 *   - Bathroom & Shower: 1 per group per week
 *       Group 1 (Leo, Phil, Karti, Andrew) → rotates weekly
 *       Group 2 (Eli, Mitchell, Hall) → rotates weekly
 *   - Living Room & Table: every other day across all members (independent rotation)
 */

// ---- Constants ----
const NAMES = ["Leo", "Phil", "Karti", "Andrew", "Eli", "Mitchell", "Hall"];
const START_DATE = new Date("2025-08-26T00:00:00"); // inclusive
const END_DATE = new Date("2025-12-05T23:59:59"); // inclusive

// Groups
const GROUP1 = ["Leo", "Phil", "Karti", "Andrew"];
const GROUP2 = ["Eli", "Mitchell", "Hall"];

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
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((bUTC - aUTC) / MS);
}

function weekIndexFor(date) {
  const diff = daysBetween(START_DATE, date);
  return Math.floor(diff / 7);
}

// Compute assignments for a given date
function assignmentsFor(date) {
  if (date < START_DATE || date > END_DATE) return null;
  const w = weekIndexFor(date);

  // --- Base rotations ---
  // Trash: start with Hall on week 0
  let trashIdx = (w + NAMES.indexOf("Hall")) % NAMES.length;

  // Bathrooms (base)
  let bath1 = GROUP1[w % GROUP1.length];
  let bath2 = GROUP2[w % GROUP2.length];

  // Resolve conflicts: ensure weekly roles are all distinct
  // Priority: keep week-0 trash = Hall; adjust bathrooms if conflict with Hall on week 0
  if (w === 0 && (NAMES[trashIdx] === bath1 || NAMES[trashIdx] === bath2)) {
    if (NAMES[trashIdx] === bath1) {
      // advance within GROUP1 until different from Hall
      let i = (w + 1) % GROUP1.length;
      while (GROUP1[i] === NAMES[trashIdx]) i = (i + 1) % GROUP1.length;
      bath1 = GROUP1[i];
    }
    if (NAMES[trashIdx] === bath2) {
      let j = (w + 1) % GROUP2.length;
      while (GROUP2[j] === NAMES[trashIdx]) j = (j + 1) % GROUP2.length;
      bath2 = GROUP2[j];
    }
  }

  // For other weeks: if Trash collides with a bathroom assignee, advance trash until unique
  if (w !== 0) {
    const used = new Set([bath1, bath2]);
    let safety = 0;
    while (used.has(NAMES[trashIdx]) && safety < 10) {
      trashIdx = (trashIdx + 1) % NAMES.length;
      safety++;
    }
  }

  const trash = NAMES[trashIdx];

  // Vacuum base (offset from w) then adjust to avoid any collisions
  let vacuumIdx = (w + 3) % NAMES.length;
  const used2 = new Set([trash, bath1, bath2]);
  let guard = 0;
  while (used2.has(NAMES[vacuumIdx]) && guard < 10) {
    vacuumIdx = (vacuumIdx + 1) % NAMES.length;
    guard++;
  }
  const vacuum = NAMES[vacuumIdx];

  // Living Room every other day (independent)
  const dayOffset = daysBetween(START_DATE, date);
  let living = null;
  if (dayOffset % 2 === 0) {
    const livingTurns = Math.floor(dayOffset / 2);
    living = NAMES[livingTurns % NAMES.length];
  }

  return {
    trash,
    vacuum,
    bathroomGroup1: bath1,
    bathroomGroup2: bath2,
    livingRoom: living,
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
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return clampDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate())
    );
  });

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
            <Card title="🚿 Bathroom + Shower – Group 1">
              {data.bathroomGroup1}
            </Card>
            <Card title="🚿 Bathroom + Shower – Group 2">
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
      </div>
    </div>
  );
}
