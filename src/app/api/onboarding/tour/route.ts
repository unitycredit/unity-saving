import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client, objectKey } from "@/lib/aws/s3";

export const runtime = "nodejs";

const TOUR_VERSION = 1;

async function getObjectString(params: { key: string }) {
  const s3 = getS3Client();
  const bucket = getBucketName();
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: params.key }));
  const body = (out as any).Body;
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

    const key = objectKey(`onboarding/${userId}`, "welcome-tour.json");

    try {
      const text = await getObjectString({ key });
      const parsed = JSON.parse(text || "{}") as { version?: unknown; completedAt?: unknown };
      const version = typeof parsed.version === "number" ? parsed.version : 0;
      const completedAt = typeof parsed.completedAt === "string" ? parsed.completedAt : null;
      const seen = version >= TOUR_VERSION && Boolean(completedAt);
      return NextResponse.json({ ok: true, seen, version, requiredVersion: TOUR_VERSION, completedAt });
    } catch {
      return NextResponse.json({ ok: true, seen: false, version: 0, requiredVersion: TOUR_VERSION, completedAt: null });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onboarding tour GET error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { action?: unknown } | null;
    const action = typeof body?.action === "string" ? body.action : "completed";
    const completedAt = new Date().toISOString();

    const key = objectKey(`onboarding/${userId}`, "welcome-tour.json");
    const doc = { userId, version: TOUR_VERSION, action, completedAt };

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

    return NextResponse.json({ ok: true, seen: true, version: TOUR_VERSION, completedAt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onboarding tour POST error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

