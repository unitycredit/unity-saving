import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client } from "@/lib/aws/s3";

export const runtime = "nodejs";

function isSafeKey(key: string) {
  // Basic hardening: keep it simple (no absolute paths / traversal).
  if (!key) return false;
  if (key.includes("..")) return false;
  if (key.startsWith("/")) return false;
  return true;
}

function fileNameFromKey(key: string) {
  const name = key.replaceAll("\\", "/").split("/").pop() ?? "file";
  return name.trim() || "file";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { key?: string; disposition?: "inline" | "attachment" }
    | null;
  const key = (body?.key ?? "").trim();
  if (!isSafeKey(key)) {
    return NextResponse.json({ error: "invalid_key" }, { status: 400 });
  }

  const disposition: "inline" | "attachment" =
    body?.disposition === "attachment" ? "attachment" : "inline";

  const s3 = getS3Client();
  const bucket = getBucketName();

  const fileName = fileNameFromKey(key);
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `${disposition}; filename="${fileName.replaceAll('"', "")}"`,
    }),
    {
      expiresIn: 60 * 10,
    },
  );

  return NextResponse.json({ key, url, method: "GET", disposition });
}


