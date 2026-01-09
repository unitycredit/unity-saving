import { NextResponse } from "next/server";

import { userDataKey } from "@/lib/aws/s3";
import { getCognitoCookieUser } from "@/lib/server/cognitoUser";
import { getJsonObject, putJsonObject } from "@/lib/server/s3Json";

export const runtime = "nodejs";

export type ContactV1 = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string; // e.g. Financial advisor, Accountant, Family
  notes?: string;
  createdAt: string;
};

type ContactsDocV1 = {
  version: 1;
  items: ContactV1[];
  updatedAt: string;
};

function defaultDoc(): ContactsDocV1 {
  return { version: 1, items: [], updatedAt: new Date(0).toISOString() };
}

function normalizeContact(raw: any): ContactV1 | null {
  const id = typeof raw?.id === "string" ? raw.id.trim() : "";
  const name = typeof raw?.name === "string" ? raw.name.trim() : "";
  if (!id || !name) return null;

  const phone = typeof raw?.phone === "string" ? raw.phone.trim() : undefined;
  const email = typeof raw?.email === "string" ? raw.email.trim() : undefined;
  const role = typeof raw?.role === "string" ? raw.role.trim() : undefined;
  const notes = typeof raw?.notes === "string" ? raw.notes.trim() : undefined;
  const createdAt = typeof raw?.createdAt === "string" ? raw.createdAt : new Date().toISOString();

  return { id, name, phone, email, role, notes, createdAt };
}

export async function GET() {
  const user = getCognitoCookieUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const key = userDataKey(user.userId, "contacts.json");
  const doc = await getJsonObject<ContactsDocV1>({ key, defaultValue: defaultDoc() });
  const items = Array.isArray((doc as any)?.items) ? (doc as any).items : [];
  const normalized = items.map(normalizeContact).filter(Boolean) as ContactV1[];

  return NextResponse.json({ items: normalized, updatedAt: doc.updatedAt ?? null });
}

export async function PUT(req: Request) {
  const user = getCognitoCookieUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { items?: unknown } | null;
  const rawItems = Array.isArray(body?.items) ? body?.items : [];
  if (rawItems.length > 5000) {
    return NextResponse.json({ error: "too_many_contacts" }, { status: 400 });
  }

  const items = rawItems.map(normalizeContact).filter(Boolean) as ContactV1[];
  const key = userDataKey(user.userId, "contacts.json");
  const updatedAt = new Date().toISOString();
  const doc: ContactsDocV1 = { version: 1, items, updatedAt };

  await putJsonObject({ key, value: doc });
  return NextResponse.json({ ok: true, updatedAt });
}

import { NextResponse } from "next/server";

import { getBucketName, getS3Client, userDataKey } from "@/lib/aws/s3";
import { getJsonObject, putJsonObject } from "@/lib/aws/s3Json";
import { getAuthedUser } from "@/lib/aws/userSession";

export const runtime = "nodejs";

export type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
};

type ContactsDoc = {
  items: Contact[];
  updatedAt: string | null;
};

export async function GET() {
  const user = getAuthedUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const s3 = getS3Client();
  const bucket = getBucketName();
  const key = userDataKey(user.userId, "contacts.json");

  const existing = await getJsonObject<ContactsDoc>({ s3, bucket, key });
  return NextResponse.json(
    existing ?? {
      items: [],
      updatedAt: null,
    },
  );
}

export async function PUT(req: Request) {
  const user = getAuthedUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { items?: Contact[] } | null;
  const items = Array.isArray(body?.items) ? body!.items : [];

  // Basic sanitization
  const cleaned: Contact[] = items
    .filter((x): x is Contact => Boolean(x && typeof x === "object"))
    .map((x) => ({
      id: String(x.id ?? "").slice(0, 120) || `c_${Date.now()}`,
      name: String(x.name ?? "").slice(0, 140),
      email: x.email ? String(x.email).slice(0, 200) : undefined,
      phone: x.phone ? String(x.phone).slice(0, 60) : undefined,
      role: x.role ? String(x.role).slice(0, 80) : undefined,
    }))
    .filter((x) => x.name.trim().length > 0);

  const doc: ContactsDoc = {
    items: cleaned,
    updatedAt: new Date().toISOString(),
  };

  const s3 = getS3Client();
  const bucket = getBucketName();
  const key = userDataKey(user.userId, "contacts.json");
  await putJsonObject({ s3, bucket, key, value: doc });

  return NextResponse.json({ ok: true, ...doc });
}


