import { GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client, objectKey } from "@/lib/aws/s3";

export const runtime = "nodejs";

async function bodyToString(body: any) {
  if (!body) return "";
  if (typeof body.transformToString === "function") return await body.transformToString();
  const chunks: Buffer[] = [];
  for await (const chunk of body as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const key = objectKey(`contacts/${userId}`, "contacts.json");
    const s3 = getS3Client();
    const bucket = getBucketName();

    try {
      const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const text = await bodyToString(out.Body);
      const parsed = JSON.parse(text || "{}") as { contacts?: unknown; updatedAt?: unknown };
      const contacts = Array.isArray(parsed.contacts) ? parsed.contacts : [];
      const updatedAt = typeof parsed.updatedAt === "string" ? parsed.updatedAt : null;
      return NextResponse.json({ ok: true, key, updatedAt, contacts });
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (typeof message === "string" && message.toLowerCase().includes("nosuchkey")) {
        return NextResponse.json({ ok: true, key, updatedAt: null, contacts: [] });
      }
      // If the object doesn't exist or can't be read, treat as empty (non-fatal).
      return NextResponse.json({ ok: true, key, updatedAt: null, contacts: [] });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Contacts get route error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

