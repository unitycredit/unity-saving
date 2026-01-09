import { S3Client } from "@aws-sdk/client-s3";

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getBucketName() {
  return required("AWS_BUCKET_NAME", process.env.AWS_BUCKET_NAME);
}

export function getS3Client() {
  const region = required("AWS_REGION", process.env.AWS_REGION);

  // Support requested env var names, plus the standard AWS names.
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY ?? "";
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_KEY ?? "";

  required("AWS_ACCESS_KEY (or AWS_ACCESS_KEY_ID)", accessKeyId);
  required("AWS_SECRET_KEY (or AWS_SECRET_ACCESS_KEY)", secretAccessKey);

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function normalizeFolder(folder: string) {
  const cleaned = folder.trim().replace(/^\/+|\/+$/g, "");
  if (!cleaned) return "Bank Statements";
  if (cleaned.includes("..")) return "Bank Statements";
  return cleaned;
}

export function objectKey(folder: string, fileName: string) {
  const prefix = (process.env.UNITY_S3_PREFIX ?? "").trim().replace(/^\/+|\/+$/g, "");
  const safeFolder = normalizeFolder(folder);
  const safeName =
    fileName
      .replaceAll("\\", "/")
      .split("/")
      .pop()
      ?.trim()
      .slice(0, 180) || "file";

  const base = `${safeFolder}/${safeName}`;
  return prefix ? `${prefix}/${base}` : base;
}

function s3Prefix() {
  return (process.env.UNITY_S3_PREFIX ?? "").trim().replace(/^\/+|\/+$/g, "");
}

export function safeUserId(userId: string) {
  const cleaned = userId.trim().slice(0, 120);
  // Keep the path stable and safe.
  return cleaned.replace(/[^a-zA-Z0-9_-]/g, "_") || "user";
}

export function userDataKey(userId: string, fileName: string) {
  const prefix = s3Prefix();
  const safeId = safeUserId(userId);
  const safeName = fileName.trim().replaceAll("\\", "/").split("/").pop()?.trim() || "data.json";
  const base = `.unity-saving/${safeId}/${safeName}`;
  return prefix ? `${prefix}/${base}` : base;
}


