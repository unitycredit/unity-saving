import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client } from "@/lib/aws/s3";
import { isSafeId, noteKeyFromId } from "@/app/api/notes/_shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { id?: string } | null;
    const id = (body?.id ?? "").trim();
    if (!isSafeId(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const key = noteKeyFromId({ userId, id });
    const s3 = getS3Client();
    const bucket = getBucketName();
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    return NextResponse.json({ ok: true, id, key });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete note route error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

