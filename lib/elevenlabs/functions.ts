import { uploadFile } from "@/lib/r2/functions";
import { elevenlabs } from "@/lib/elevenlabs";
import { FormLanguage } from "@/features/forms/schema";

const VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID!;

export const generateTTS = async ({
  text,
  formId,
  language,
}: {
  text: string;
  formId: string;
  language: FormLanguage;
}) => {
  const audio = await elevenlabs.textToSpeech.convert(VOICE_ID, {
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
