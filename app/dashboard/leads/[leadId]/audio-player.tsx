"use client";

import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

export default function AudioPlayer({ url }: { url: string }) {
  const t = useTranslations("dashboard.leads.detail");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    }
    audioRef.current.play();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePlay}>
      <PlayIcon className="size-3.5" />
      {t("play")}
    </Button>
  );
}
