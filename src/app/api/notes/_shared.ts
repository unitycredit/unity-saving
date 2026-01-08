import { GetObjectCommand } from "@aws-sdk/client-s3";

import { getBucketName, getS3Client, objectKey } from "@/lib/aws/s3";

// Stored as: /notes/[user-id]/[note-id].json (prefix is optional via UNITY_S3_PREFIX)
export const NOTES_FOLDER = "notes";

export function notesFolderForUser(userId: string) {
  return `${NOTES_FOLDER}/${userId}`;
}

export function noteKeyFromId(params: { userId: string; id: string }) {
  return objectKey(notesFolderForUser(params.userId), `${params.id}.json`);
}

export function idFromNoteKey(key: string) {
  const base = key.replaceAll("\\", "/").split("/").pop() ?? "";
  if (!base.endsWith(".json")) return null;
  const id = base.slice(0, -".json".length);
  return isSafeId(id) ? id : null;
}

export function isSafeId(id: string) {
  if (!id) return false;
  if (id.length > 80) return false;
  // Keep it simple: letters, numbers, underscore, dash.
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

export function noteTitleFromContent(content: string) {
  const firstLine = content
    .split(/\r?\n/g)
    .map((x) => x.trim())
    .find(Boolean);
  const title = (firstLine ?? "Untitled note").slice(0, 80).trim();
  return title || "Untitled note";
}

export async function getObjectString(params: { key: string }) {
  const s3 = getS3Client();
  const bucket = getBucketName();
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: params.key }));
  const body = out.Body;

  if (!body) return "";
  // @ts-expect-error - Node stream / web stream differences across runtimes.
  if (typeof body.transformToString === "function") return await body.transformToString();

  const chunks: Buffer[] = [];
  // @ts-expect-error - Body is AsyncIterable in Node.
  for await (const chunk of body as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

