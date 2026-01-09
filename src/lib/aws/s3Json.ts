import { GetObjectCommand, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";

function isReadableStream(x: unknown): x is NodeJS.ReadableStream {
  return Boolean(x) && typeof x === "object" && "on" in (x as Record<string, unknown>);
}

async function bodyToString(body: unknown): Promise<string> {
  if (!body) return "";

  // AWS SDK v3 in Node sometimes provides helper.
  if (typeof (body as { transformToString?: unknown }).transformToString === "function") {
    return await (body as { transformToString: () => Promise<string> }).transformToString();
  }

  if (isReadableStream(body)) {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      body.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      body.on("end", () => resolve());
      body.on("error", (err) => reject(err));
    });
    return Buffer.concat(chunks).toString("utf8");
  }

  // Fallback (shouldn't happen in node runtime)
  return String(body);
}

export async function getJsonObject<T>(params: {
  s3: S3Client;
  bucket: string;
  key: string;
}): Promise<T | null> {
  const { s3, bucket, key } = params;
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const raw = await bodyToString(out.Body);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    const name = e && typeof e === "object" && "name" in e ? String((e as { name?: unknown }).name) : "";
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw e;
  }
}

export async function putJsonObject(params: {
  s3: S3Client;
  bucket: string;
  key: string;
  value: unknown;
}): Promise<void> {
  const { s3, bucket, key, value } = params;
  const body = JSON.stringify(value, null, 2);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
      CacheControl: "no-store",
    }),
  );
}


