import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client, objectKey } from "@/lib/aws/s3";

export const runtime = "nodejs";

function isString(x: unknown): x is string {
  return typeof x === "string";
}

function safeTrim(x: unknown, max = 4000) {
  if (!isString(x)) return "";
  return x.trim().slice(0, max);
}

function safeEmail(x: unknown) {
  const v = safeTrim(x, 254);
  return v;
}

function safePhone(x: unknown) {
  return safeTrim(x, 60);
}

function safeRole(x: unknown) {
  return safeTrim(x, 80);
}

function safeName(x: unknown) {
  return safeTrim(x, 120);
}

function safeId(x: unknown) {
  const v = safeTrim(x, 80);
  if (!v) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return null;
  return v;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { contacts?: unknown } | null;
    const arr = Array.isArray(body?.contacts) ? (body!.contacts as unknown[]) : null;
    if (!arr) return NextResponse.json({ error: "invalid_contacts" }, { status: 400 });

    const now = new Date().toISOString();

    const contacts = arr
      .map((raw) => {
        const obj = (raw ?? {}) as Record<string, unknown>;
        const id = safeId(obj.id);
        if (!id) return null;
        const createdAt = safeTrim(obj.createdAt, 80) || now;
        const updatedAt = now;
        const fullName = safeName(obj.fullName);
        const role = safeRole(obj.role);
        const phone = safePhone(obj.phone);
        const email = safeEmail(obj.email);
        const privateNotes = safeTrim(obj.privateNotes, 8000);
        return { id, fullName, role, phone, email, privateNotes, createdAt, updatedAt };
      })
      .filter(Boolean);

    const key = objectKey(`contacts/${userId}`, "contacts.json");

    const doc = {
      userId,
      updatedAt: now,
      contacts,
      kind: "contacts_v1",
    };

    const s3 = getS3Client();
    const bucket = getBucketName();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: "application/json",
        Body: JSON.stringify(doc),
      }),
    );

    return NextResponse.json({ ok: true, key, updatedAt: now, count: contacts.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Contacts save route error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

