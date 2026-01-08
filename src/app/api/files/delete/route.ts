import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client } from "@/lib/aws/s3";

export const runtime = "nodejs";

function isSafeKey(key: string) {
  if (!key) return false;
  if (key.includes("..")) return false;
  if (key.startsWith("/")) return false;
  return true;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { key?: string } | null;
    const key = (body?.key ?? "").trim();
    if (!isSafeKey(key)) return NextResponse.json({ error: "invalid_key" }, { status: 400 });

    const s3 = getS3Client();
    const bucket = getBucketName();

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return NextResponse.json({ ok: true, key });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete route error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

