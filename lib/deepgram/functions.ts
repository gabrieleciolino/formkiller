import { deepgram } from "@/lib/deepgram";

export const generateSTT = async ({ file }: { file: File }) => {
  const result = await deepgram.listen.v1.media.transcribeFile(file, {
    model: "nova-3",
    smart_format: true,
  });
};
