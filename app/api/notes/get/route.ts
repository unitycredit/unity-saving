import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isSafeId, getObjectString, noteKeyFromId, noteTitleFromContent } from "@/app/api/notes/_shared";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") ?? "").trim();
    if (!isSafeId(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const key = noteKeyFromId({ userId, id });
    const text = await getObjectString({ key });

    const parsed = JSON.parse(text || "{}") as {
      id?: string;
      title?: string;
      content?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    const note = {
      id,
      title:
        typeof parsed.title === "string"
          ? parsed.title
          : typeof parsed.content === "string"
            ? noteTitleFromContent(parsed.content)
            : "Untitled note",
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : null,
      content: typeof parsed.content === "string" ? parsed.content : "",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };

    return NextResponse.json({ note });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Get note route error";
    // Common case: missing key / access denied -> treat as not found to the client.
    if (typeof message === "string" && message.toLowerCase().includes("nosuchkey")) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

