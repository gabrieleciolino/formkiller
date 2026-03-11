import { uploadFile } from "@/lib/r2/functions";
import { elevenlabs } from "@/lib/elevenlabs";

const VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID!;

export const generateTTS = async ({
  text,
  formId,
}: {
  text: string;
  formId: string;
}) => {
  const audio = await elevenlabs.textToSpeech.convert(VOICE_ID, {
    text,
    modelId: "eleven_turbo_v2_5",
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
