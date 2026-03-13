"use client";

import { MAX_RECORDING_SECONDS } from "@/features/forms/constants";
import type { RecordingButtonProps } from "@/features/forms/types";
import { StopCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RecordingButton({ onStop, isDark }: RecordingButtonProps) {
  const [elapsed, setElapsed] = useState(0);
  const onStopRef = useRef(onStop);

  useEffect(() => {
    onStopRef.current = onStop;
  });

  useEffect(() => {
    const startTime = Date.now();
    const id = setInterval(() => {
      const nextElapsed = Math.min(
        (Date.now() - startTime) / 1000,
        MAX_RECORDING_SECONDS,
      );

      setElapsed(nextElapsed);

      if (nextElapsed >= MAX_RECORDING_SECONDS) {
        clearInterval(id);
        onStopRef.current(true);
      }
    }, 50);

    return () => clearInterval(id);
  }, []);

  // decrements: starts full, empties as time passes
  const dashoffset = CIRCUMFERENCE * (elapsed / MAX_RECORDING_SECONDS);

  return (
    <div className="relative size-20">
      <button
        onClick={() => onStopRef.current(false)}
        className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/80 text-white transition-all active:scale-95 hover:bg-red-500/90"
      >
        <StopCircleIcon className="size-8" />
      </button>
      <svg
        className="pointer-events-none absolute inset-0 -rotate-90"
        viewBox="0 0 80 80"
        fill="none"
      >
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="3"
        />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="3"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
