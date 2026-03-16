import { uploadFile } from "@/lib/r2/functions";
import { elevenlabs } from "@/lib/elevenlabs";
import { FormLanguage } from "@/features/forms/schema";

const DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID?.trim() ?? null;

export type ElevenLabsVoiceOption = {
  id: string;
  name: string;
  category: string | null;
  previewUrl: string | null;
};

export const getDefaultElevenLabsVoiceId = () => DEFAULT_VOICE_ID;

export const getElevenLabsVoices = async (): Promise<ElevenLabsVoiceOption[]> => {
  const response = await elevenlabs.voices.getAll();
  const voices = response.voices ?? [];

  return voices
    .map((voice) => ({
      id: voice.voiceId,
      name: voice.name?.trim() || voice.voiceId,
      category: voice.category ?? null,
      previewUrl: voice.previewUrl ?? null,
    }))
    .filter((voice) => voice.id.trim().length > 0)
    .sort((first, second) =>
      first.name.localeCompare(second.name, undefined, {
        sensitivity: "base",
      }),
    );
};

const resolveVoiceId = (voiceId?: string | null) => {
  const normalizedVoiceId = voiceId?.trim();

  if (normalizedVoiceId) {
    return normalizedVoiceId;
  }

  if (DEFAULT_VOICE_ID) {
    return DEFAULT_VOICE_ID;
  }

  throw new Error("Missing ElevenLabs voice id.");
};

export const generateTTS = async ({
  text,
  formId,
  language,
  voiceId,
}: {
  text: string;
  formId: string;
  language: FormLanguage;
  voiceId?: string | null;
}) => {
  const audio = await elevenlabs.textToSpeech.convert(resolveVoiceId(voiceId), {
    text,
    modelId: "eleven_multilingual_v2",
    languageCode: language,
  });

  const buffer = Buffer.from(await new Response(audio).arrayBuffer());
  const key = `tts/${formId}/${Date.now()}.mp3`;

  const url = await uploadFile({
    key,
    body: buffer,
    contentType: "audio/mpeg",
  });

  return { url, key };
};
