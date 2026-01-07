import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client, normalizeFolder, objectKey } from "@/lib/aws/s3";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
}


