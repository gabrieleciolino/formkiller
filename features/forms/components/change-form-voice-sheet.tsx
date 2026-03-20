"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getElevenLabsVoicesAction,
  updateFormVoiceAction,
} from "@/features/forms/actions";
import {
  FORM_VOICE_SPEED_DEFAULT,
  FORM_VOICE_SPEED_MAX,
  FORM_VOICE_SPEED_MIN,
  FORM_VOICE_SPEED_STEP,
} from "@/features/forms/schema";
import { Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

type VoiceOption = {
  id: string;
  name: string;
  category: string | null;
  previewUrl: string | null;
};

type ChangeFormVoiceSheetProps = {
  formId: string;
  initialVoiceId: string | null;
  initialVoiceSpeed: number | null;
};

const normalizeVoiceId = (value: string | null | undefined) => value?.trim() ?? "";
const normalizeVoiceSpeed = (value: number | null | undefined) =>
  Math.min(
    FORM_VOICE_SPEED_MAX,
    Math.max(FORM_VOICE_SPEED_MIN, value ?? FORM_VOICE_SPEED_DEFAULT),
  );

export default function ChangeFormVoiceSheet({
  formId,
  initialVoiceId,
  initialVoiceSpeed,
}: ChangeFormVoiceSheetProps) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    normalizeVoiceId(initialVoiceId),
  );
  const [savedVoiceId, setSavedVoiceId] = useState(normalizeVoiceId(initialVoiceId));
  const [selectedVoiceSpeed, setSelectedVoiceSpeed] = useState(
    normalizeVoiceSpeed(initialVoiceSpeed),
  );
  const [savedVoiceSpeed, setSavedVoiceSpeed] = useState(
    normalizeVoiceSpeed(initialVoiceSpeed),
  );
  const [isVoicesPending, setIsVoicesPending] = useState(false);
  const [isVoicesError, setIsVoicesError] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();
  const selectedVoiceIdRef = useRef(selectedVoiceId);

  useEffect(() => {
    const normalizedInitialVoiceId = normalizeVoiceId(initialVoiceId);
    setSelectedVoiceId(normalizedInitialVoiceId);
    setSavedVoiceId(normalizedInitialVoiceId);
    const normalizedInitialVoiceSpeed = normalizeVoiceSpeed(initialVoiceSpeed);
    setSelectedVoiceSpeed(normalizedInitialVoiceSpeed);
    setSavedVoiceSpeed(normalizedInitialVoiceSpeed);
  }, [initialVoiceId, initialVoiceSpeed]);

  useEffect(() => {
    selectedVoiceIdRef.current = selectedVoiceId;
  }, [selectedVoiceId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    const loadVoices = async () => {
      setIsVoicesPending(true);
      setIsVoicesError(false);

      try {
        const { data, serverError, validationErrors } =
          await getElevenLabsVoicesAction({});

        if (serverError || validationErrors || !data) {
          throw new Error("Unable to load ElevenLabs voices.");
        }

        const currentSavedVoiceId = normalizeVoiceId(savedVoiceId);
        const defaultVoiceId = normalizeVoiceId(data.defaultVoiceId);
        const nextVoiceOptions = [...data.voices];

        if (
          currentSavedVoiceId &&
          !nextVoiceOptions.some((voice) => voice.id === currentSavedVoiceId)
        ) {
          nextVoiceOptions.unshift({
            id: currentSavedVoiceId,
            name: currentSavedVoiceId,
            category: null,
            previewUrl: null,
          });
        }

        if (
          defaultVoiceId &&
          !nextVoiceOptions.some((voice) => voice.id === defaultVoiceId)
        ) {
          nextVoiceOptions.unshift({
            id: defaultVoiceId,
            name: t("forms.edit.defaultVoiceName"),
            category: null,
            previewUrl: null,
          });
        }

        if (!isActive) {
          return;
        }

        setVoiceOptions(nextVoiceOptions);

        const currentSelectedVoiceId = normalizeVoiceId(
          selectedVoiceIdRef.current,
        );
        const fallbackVoiceId = defaultVoiceId || nextVoiceOptions[0]?.id || "";
        const voiceToSelect = [currentSelectedVoiceId, currentSavedVoiceId].find(
          (voiceId) =>
            voiceId.length > 0 &&
            nextVoiceOptions.some((voice) => voice.id === voiceId),
        );

        setSelectedVoiceId(voiceToSelect ?? fallbackVoiceId);
      } catch {
        if (!isActive) {
          return;
        }

        setIsVoicesError(true);
      } finally {
        if (isActive) {
          setIsVoicesPending(false);
        }
      }
    };

    void loadVoices();

    return () => {
      isActive = false;
    };
  }, [open, savedVoiceId, t]);

  const selectedVoice = useMemo(
    () => voiceOptions.find((voice) => voice.id === selectedVoiceId) ?? null,
    [selectedVoiceId, voiceOptions],
  );
  const hasVoiceSelection = selectedVoiceId.trim().length > 0;
  const normalizedSelectedVoiceSpeed =
    Math.round(selectedVoiceSpeed * 100) / 100;
  const normalizedSavedVoiceSpeed = Math.round(savedVoiceSpeed * 100) / 100;
  const isVoiceChanged =
    hasVoiceSelection &&
    (selectedVoiceId !== savedVoiceId ||
      normalizedSelectedVoiceSpeed !== normalizedSavedVoiceSpeed);

  const handleSave = () => {
    if (!isVoiceChanged) {
      return;
    }

    startSubmitting(async () => {
      try {
        const { data, serverError, validationErrors } = await updateFormVoiceAction({
          formId,
          voiceId: selectedVoiceId,
          voiceSpeed: normalizedSelectedVoiceSpeed,
        });

        if (serverError || validationErrors || !data) {
          throw new Error();
        }

        setSavedVoiceId(data.voiceId);
        setSavedVoiceSpeed(data.voiceSpeed);
        toast(t("forms.edit.voiceSaveSuccess"));
        setOpen(false);
        router.refresh();
      } catch {
        toast(t("forms.edit.voiceSaveError"));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Volume2 className="size-4" />
          {t("forms.edit.voiceTrigger")}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="pr-12">
          <SheetTitle>{t("forms.edit.voiceTitle")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-2">
          <Field>
            <FieldLabel>{t("forms.edit.voice")}</FieldLabel>
            <Select
              value={selectedVoiceId || undefined}
              onValueChange={setSelectedVoiceId}
              disabled={isVoicesPending || voiceOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isVoicesPending
                      ? t("forms.edit.voiceLoading")
                      : voiceOptions.length === 0
                        ? t("forms.edit.voiceUnavailable")
                        : t("forms.edit.voicePlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {voiceOptions.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isVoicesError ? (
              <FieldDescription className="text-destructive">
                {t("forms.edit.voiceLoadError")}
              </FieldDescription>
            ) : (
              <FieldDescription>{t("forms.edit.voiceHint")}</FieldDescription>
            )}
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>{t("forms.edit.voiceSpeed")}</FieldLabel>
              <span className="text-sm text-muted-foreground">
                {normalizedSelectedVoiceSpeed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={FORM_VOICE_SPEED_MIN}
              max={FORM_VOICE_SPEED_MAX}
              step={FORM_VOICE_SPEED_STEP}
              value={selectedVoiceSpeed}
              onChange={(event) => {
                setSelectedVoiceSpeed(
                  normalizeVoiceSpeed(Number(event.target.value)),
                );
              }}
              className="w-full accent-primary"
            />
            <FieldDescription>{t("forms.edit.voiceSpeedHint")}</FieldDescription>
          </Field>

          <div className="rounded-md border border-border bg-card p-3">
            <p className="text-sm font-medium text-foreground">
              {selectedVoice?.name ?? t("forms.edit.voiceUnavailable")}
            </p>
            {selectedVoice?.category && (
              <p className="text-xs text-muted-foreground">
                {selectedVoice.category}
              </p>
            )}
            <audio
              className="mt-2 w-full"
              controls
              preload="none"
              src={selectedVoice?.previewUrl ?? undefined}
            />
            {!selectedVoice?.previewUrl && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("forms.edit.voicePreviewUnavailable")}
              </p>
            )}
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={handleSave}
            disabled={
              isSubmitting ||
              isVoicesPending ||
              !hasVoiceSelection ||
              !isVoiceChanged
            }
          >
            {isSubmitting
              ? t("forms.edit.voiceSaving")
              : t("forms.edit.voiceSave")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
