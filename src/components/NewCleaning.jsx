"use client";
import { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { listAll, ref, getStorage, getDownloadURL } from "firebase/storage";
import { UploadQR } from "./UploadQR";

// ======= CONFIG =======
// 3‑day rotation defined by the user
const ROTATION = [
  {
    label: "Day 1 (Wednesday template)",
    tasks: [
      { task: "Trash", person: "Phil" },
      { task: "Living Room", person: "Eli" },
    ],
  },
  {
    label: "Day 2 (Thursday template)",
    tasks: [
      { task: "Living Room", person: "Leo" },
      { task: "Vacuum", person: "Hall" },
    ],
  },
  {
    label: "Day 3 (Friday template)",
    tasks: [
      { task: "Trash", person: "Mitchell" },
      { task: "Living Room", person: "Andrew" },
    ],
  },
];

const ANCHOR_LOCAL = new Date(2025, 9, 22); // months 0-based: 9 = October

// Hard cutoff: stop showing schedule after this date (inclusive end on Dec 15)
const CUTOFF_LOCAL_END = new Date(2025, 11, 15, 23, 59, 59, 999); // Dec 15, 2025 23:59:59.999

// Firebase
const app = initializeApp({
  apiKey: "AIzaSyDq_DTfqCiS0yUtThW550GOR3Hjpbhzhws",
  authDomain: "esp-project-1621c.firebaseapp.com",
  projectId: "esp-project-1621c",
  storageBucket: "esp-project-1621c.firebasestorage.app",
});
const storage = getStorage(app);

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getDaysSinceAnchor(today = new Date()) {
  // strip time for both dates for a clean day-diff in local time
  const a = new Date(
    ANCHOR_LOCAL.getFullYear(),
    ANCHOR_LOCAL.getMonth(),
    ANCHOR_LOCAL.getDate()
  );
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor((t.getTime() - a.getTime()) / MS_PER_DAY);
}

function getTodayTasks() {
  const now = new Date();
  const isAfterCutoff = now.getTime() > CUTOFF_LOCAL_END.getTime();

  if (isAfterCutoff) {
    return {
      date: formatToday(),
      stopped: true,
      tasks: [],
      dayIndex: null,
      label: "No schedule",
    };
  }

  const delta = getDaysSinceAnchor(now);
  const dayIndex =
    ((delta % ROTATION.length) + ROTATION.length) % ROTATION.length; // safe mod
  const { tasks, label } = ROTATION[dayIndex];

  return {
    date: formatToday(),
    stopped: false,
    tasks,
    dayIndex,
    label,
  };
}

export default function CleaningScheduleDisplay() {
  const [idx, setIdx] = useState(0);
  const [images, setImages] = useState([]);
  const { date, tasks, stopped, label, dayIndex } = useMemo(
    () => getTodayTasks(),
    []
  );

  // Load background images from Firebase Storage root folder
  useEffect(() => {
    const loadImages = async () => {
      try {
        const folderRef = ref(storage, "");
        const listings = await listAll(folderRef);
        const imagePromises = listings.items.map(
          async (img) => await getDownloadURL(img)
        );
        const imageUrls = await Promise.all(imagePromises);
        setImages(imageUrls);
        console.log("Loaded images:", imageUrls);
      } catch (error) {
        console.error("Error loading images:", error);
      }
    };

    loadImages();
    const interval = setInterval(loadImages, 60000);

    return () => clearInterval(interval);
  }, []);

  // Cycle through images every 20s (was 1s)
  useEffect(() => {
    if (images.length > 0) {
      const t = setInterval(
        () => setIdx((i) => (i + 1) % images.length),
        20000
      );
      return () => clearInterval(t);
    }
  }, [images.length]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {images.map((imageUrl, imageIdx) => (
        <img
          key={imageUrl}
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-contain bg-black"
          style={{ opacity: imageIdx === idx ? 1 : 0 }}
        />
      ))}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Foreground */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        {/* Center content is now EMPTY since we’re moving tasks to right */}
      </div>

      {/* Right side panel */}
      <div className="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-end p-6 space-y-6 text-white">
        {/* Task card */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg text-center max-w-xs w-full">
          <div className="text-lg font-bold mb-2">Today, {date}</div>
          {!stopped && (
            <ul className="space-y-2 text-base">
              {tasks.map((t, i) => (
                <li key={i}>
                  {t.task}: <span className="font-semibold">{t.person}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* QR code below */}
        <UploadQR />
      </div>
    </div>
  );
}
