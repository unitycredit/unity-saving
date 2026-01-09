import { NextResponse } from "next/server";

import { userDataKey } from "@/lib/aws/s3";
import { getCognitoCookieUser } from "@/lib/server/cognitoUser";
import { getJsonObject, putJsonObject } from "@/lib/server/s3Json";

export const runtime = "nodejs";

type NotesDocV1 = {
  version: 1;
  text: string;
  updatedAt: string;
};

function defaultDoc(): NotesDocV1 {
  return { version: 1, text: "", updatedAt: new Date(0).toISOString() };
}

export async function GET() {
  const user = getCognitoCookieUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const key = userDataKey(user.userId, "notes.json");
  const doc = await getJsonObject<NotesDocV1>({ key, defaultValue: defaultDoc() });

  return NextResponse.json({ text: typeof doc.text === "string" ? doc.text : "", updatedAt: doc.updatedAt ?? null });
}

export async function PUT(req: Request) {
  const user = getCognitoCookieUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text : "";
  if (text.length > 200_000) {
    return NextResponse.json({ error: "notes_too_large" }, { status: 400 });
  }

  const key = userDataKey(user.userId, "notes.json");
  const updatedAt = new Date().toISOString();
  const doc: NotesDocV1 = { version: 1, text, updatedAt };

  await putJsonObject({ key, value: doc });
  return NextResponse.json({ ok: true, updatedAt });
}

import { NextResponse } from "next/server";

import { getBucketName, getS3Client, userDataKey } from "@/lib/aws/s3";
import { getJsonObject, putJsonObject } from "@/lib/aws/s3Json";
import { getAuthedUser } from "@/lib/aws/userSession";

export const runtime = "nodejs";

type NotesDoc = {
  text: string;
  updatedAt: string | null;
};

export async function GET() {
  const user = getAuthedUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const s3 = getS3Client();
  const bucket = getBucketName();
  const key = userDataKey(user.userId, "notes.json");

  const existing = await getJsonObject<NotesDoc>({ s3, bucket, key });
  return NextResponse.json(
    existing ?? {
      text: "",
      updatedAt: null,
    },
  );
}

export async function PUT(req: Request) {
  const user = getAuthedUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = typeof body?.text === "string" ? body.text : "";

  const doc: NotesDoc = {
    text,
    updatedAt: new Date().toISOString(),
  };

  const s3 = getS3Client();
  const bucket = getBucketName();
  const key = userDataKey(user.userId, "notes.json");
  await putJsonObject({ s3, bucket, key, value: doc });

  return NextResponse.json({ ok: true, ...doc });
}


