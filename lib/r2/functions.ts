import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { R2_BUCKET, R2_PUBLIC_URL, r2 } from "./index";

export async function uploadFile({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer | Uint8Array | Blob | ReadableStream;
  contentType: string;
}) {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFile(key: string) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
  );
}

export function getFileUrl(key: string) {
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function listFiles(prefix?: string) {
  const { Contents } = await r2.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
    }),
  );

  return Contents ?? [];
}
