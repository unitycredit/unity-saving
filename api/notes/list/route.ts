import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client } from "@/lib/aws/s3";
import { getObjectString, idFromNoteKey, NOTES_FOLDER, noteTitleFromContent } from "@/app/api/notes/_shared";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prefixEnv = (process.env.UNITY_S3_PREFIX ?? "").trim().replace(/^\/+|\/+$/g, "");
    const prefix = prefixEnv ? `${prefixEnv}/${NOTES_FOLDER}/${userId}/` : `${NOTES_FOLDER}/${userId}/`;

    const s3 = getS3Client();
    const bucket = getBucketName();

    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 200,
      }),
    );

    const base = (out.Contents ?? [])
      .filter((o) => o.Key && o.Key !== prefix)
      .map((o) => ({
        key: o.Key!,
        size: o.Size ?? 0,
        lastModified: o.LastModified?.toISOString() ?? null,
      }))
      .filter((o) => idFromNoteKey(o.key) !== null);

    // Load titles from JSON (small docs, but still do it with limited concurrency).
    const limit = 6;
    const results: Array<{
      id: string;
      key: string;
      title: string;
      size: number;
      createdAt: string | null;
      updatedAt: string | null;
      lastModified: string | null;
    }> = [];
    let idx = 0;

    async function worker() {
      while (idx < base.length) {
        const i = idx++;
        const item = base[i]!;
        const id = idFromNoteKey(item.key)!;
        try {
          const text = await getObjectString({ key: item.key });
          const parsed = JSON.parse(text || "{}") as { title?: string; content?: string };
          const title =
            typeof parsed.title === "string"
              ? parsed.title
              : typeof parsed.content === "string"
                ? noteTitleFromContent(parsed.content)
                : "Untitled note";
          const createdAt = typeof (parsed as any).createdAt === "string" ? (parsed as any).createdAt : item.lastModified;
          const updatedAt = typeof (parsed as any).updatedAt === "string" ? (parsed as any).updatedAt : item.lastModified;
          results.push({ id, key: item.key, title, size: item.size, createdAt, updatedAt, lastModified: item.lastModified });
        } catch {
          // Fallback: use id, still list it.
          results.push({
            id,
            key: item.key,
            title: "Untitled note",
            size: item.size,
            createdAt: item.lastModified,
            updatedAt: item.lastModified,
            lastModified: item.lastModified,
          });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(limit, base.length) }, () => worker()));

    const notes = results
      .map((n) => ({
        ...n,
        // Make sure title isn't empty.
        title: (n.title || "Untitled note").trim() || "Untitled note",
        key: n.key,
      }))
      .sort((a, b) => {
        const ad = a.updatedAt ? Date.parse(a.updatedAt) : a.lastModified ? Date.parse(a.lastModified) : 0;
        const bd = b.updatedAt ? Date.parse(b.updatedAt) : b.lastModified ? Date.parse(b.lastModified) : 0;
        return bd - ad;
      });

    return NextResponse.json({ notes });
  } catch (e) {
    const message = e instanceof Error ? e.message : "List notes route error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

