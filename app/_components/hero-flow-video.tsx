"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

interface HeroFlowVideoProps {
  muteLabel: string;
  unmuteLabel: string;
}

export default function HeroFlowVideo({
  muteLabel,
  unmuteLabel,
}: HeroFlowVideoProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    const video = videoRef.current;
    if (!video) return;

    video.muted = nextMuted;
    if (!nextMuted && video.paused) {
      void video.play().catch(() => {
        // Ignore playback errors; user can tap the control again.
      });
    }
  };

  return (
    <div className="relative mx-auto mt-20 w-full max-w-3xl md:max-w-md">
      <div className="overflow-hidden rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          className="h-auto w-full"
        >
          <source src="/form-flow.webm" type="video/webm" />
        </video>

        <button
          type="button"
          aria-label={isMuted ? unmuteLabel : muteLabel}
          onClick={toggleAudio}
          className="absolute bottom-3 right-3 inline-flex size-10 items-center justify-center rounded-full border border-primary-foreground/30 bg-primary/40 text-primary-foreground transition-colors hover:bg-primary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70"
        >
          {isMuted ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
