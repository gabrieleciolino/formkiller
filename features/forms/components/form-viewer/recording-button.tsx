"use client";

import { MAX_RECORDING_SECONDS } from "@/features/forms/constants";
import type { RecordingButtonProps } from "@/features/forms/types";
import { StopCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RecordingButton({ onStop }: RecordingButtonProps) {
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

  const dashoffset = CIRCUMFERENCE * (elapsed / MAX_RECORDING_SECONDS);

  return (
    <div className="relative size-14">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 56 56"
        fill="none"
      >
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          stroke="rgba(239,68,68,0.15)"
          strokeWidth="2"
        />
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          stroke="rgba(239,68,68,0.7)"
          strokeWidth="2"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </svg>
      <button
        onClick={() => onStopRef.current(false)}
        className="absolute inset-0 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 active:scale-95"
      >
        <StopCircleIcon className="size-5" />
      </button>
    </div>
  );
}
