import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client } from "@/lib/aws/s3";
import { getObjectString, isSafeId, noteKeyFromId, noteTitleFromContent } from "@/app/api/notes/_shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { id?: string; content?: string } | null;
    const id = (body?.id ?? "").trim();
    const content = typeof body?.content === "string" ? body.content : "";
    if (!isSafeId(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const s3 = getS3Client();
    const bucket = getBucketName();

    const key = noteKeyFromId({ userId, id });

    // Preserve createdAt if the note already exists.
    let createdAt: string | null = null;
    try {
      const existingText = await getObjectString({ key });
      const existing = JSON.parse(existingText || "{}") as { createdAt?: string };
      if (typeof existing.createdAt === "string") createdAt = existing.createdAt;
    } catch {
      // Doesn't exist (or couldn't read) -> new note.
      createdAt = null;
    }

    const now = new Date().toISOString();
    const updatedAt = now;
    const finalCreatedAt = createdAt ?? now;
    const title = noteTitleFromContent(content);
    const note = { id, title, content, createdAt: finalCreatedAt, updatedAt };

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: "application/json",
        Body: JSON.stringify(note),
      }),
    );

    return NextResponse.json({ ok: true, key, note });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save note route error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

