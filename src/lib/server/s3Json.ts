import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { getBucketName, getS3Client } from "@/lib/aws/s3";

async function bodyToString(body: unknown): Promise<string> {
  if (!body) return "";
  if (typeof body === "string") return body;
  // AWS SDK v3 in Node typically returns a Readable stream.
  const maybeAny = body as any;
  if (typeof maybeAny.transformToString === "function") {
    return await maybeAny.transformToString();
  }

  const chunks: Buffer[] = [];
  for await (const chunk of maybeAny as AsyncIterable<Uint8Array | Buffer | string>) {
    if (typeof chunk === "string") chunks.push(Buffer.from(chunk));
    else chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isNoSuchKeyError(err: unknown) {
  const e = err as any;
  return e?.name === "NoSuchKey" || e?.Code === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404;
}

export async function getJsonObject<T>(params: { key: string; defaultValue: T }): Promise<T> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: params.key }));
    const raw = await bodyToString(out.Body);
    const parsed = safeJsonParse<T>(raw);
    return parsed ?? params.defaultValue;
  } catch (err) {
    if (isNoSuchKeyError(err)) return params.defaultValue;
    throw err;
  }
}

export async function putJsonObject(params: { key: string; value: unknown }): Promise<void> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: JSON.stringify(params.value, null, 2),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store",
    }),
  );
}


