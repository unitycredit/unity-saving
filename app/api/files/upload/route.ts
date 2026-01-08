import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getBucketName, getS3Client, normalizeFolder, objectKey } from "@/lib/aws/s3";

export const runtime = "nodejs";

/**
 * Dedicated upload route for S3.
 *
 * Note: This route returns a **presigned PUT URL** so the browser can upload
 * directly to S3 (recommended for App Runner and large files).
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as
      | { folder?: string; fileName?: string; contentType?: string }
      | null;

    const folder = normalizeFolder(body?.folder ?? "Documents");
    const fileName = body?.fileName?.trim() || "file";
    const contentType = body?.contentType?.trim() || "application/octet-stream";

    const s3 = getS3Client();
    const bucket = getBucketName();
    const key = objectKey(folder, fileName);

    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 60 * 10 },
    );

    return NextResponse.json({ key, url, method: "PUT" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload route error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


