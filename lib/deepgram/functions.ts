import { deepgram } from "@/lib/deepgram";

export const generateSTT = async ({
  buffer,
  mimeType,
}: {
  buffer: Buffer;
  mimeType: string;
}) => {
  const result = await deepgram.listen.v1.media.transcribeFile(buffer, {
    model: "nova-3",
    smart_format: true,
    language: "it",
  } as never);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result as any)?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
};
