import { deepgram } from "@/lib/deepgram";

export const generateSTT = async ({ text }: { text: string }) => {
  const response = await deepgram.speak.v1.audio.generate({
    text: "Hello, this is a sample text to speech conversion.",
    model: "",
    encoding: "linear16",
    container: "wav",
  });
};
