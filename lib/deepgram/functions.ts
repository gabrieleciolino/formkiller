import { FormLanguage } from "@/features/forms/schema";
import { deepgram } from "@/lib/deepgram";

export const generateSTT = async ({
  buffer,
  mimeType,
  language,
}: {
  buffer: Buffer;
  mimeType: string;
  language: FormLanguage;
}) => {
  const result = await deepgram.listen.v1.media.transcribeFile(buffer, {
    model: "nova-3",
    smart_format: true,
    language,
  } as never);

  type DeepgramResult = { results?: { channels?: { alternatives?: { transcript?: string }[] }[] } };
  return (result as unknown as DeepgramResult)?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
};
