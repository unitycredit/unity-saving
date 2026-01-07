import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client, normalizeFolder } from "@/lib/aws/s3";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folder = normalizeFolder(searchParams.get("folder") ?? "Documents");

  const prefixEnv = (process.env.UNITY_S3_PREFIX ?? "").trim().replace(/^\/+|\/+$/g, "");
  const prefix = prefixEnv ? `${prefixEnv}/${folder}/` : `${folder}/`;
  const envPrefixWithSlash = prefixEnv ? `${prefixEnv}/` : "";

  const s3 = getS3Client();
  const bucket = getBucketName();

  const out = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/",
      MaxKeys: 200,
    }),
  );

  const folders =
    out.CommonPrefixes?.map((p) => {
      const fullPrefix = p.Prefix ?? "";
      const withoutEnv =
        envPrefixWithSlash && fullPrefix.startsWith(envPrefixWithSlash)
          ? fullPrefix.slice(envPrefixWithSlash.length)
          : fullPrefix;
      const path = withoutEnv.replace(/\/+$/g, "");
      const name = path.split("/").pop() ?? path;
      return { name, path, prefix: fullPrefix };
    }).filter((f) => f.path && f.path !== folder) ?? [];

  const items =
    out.Contents?.filter((o) => o.Key && o.Key !== prefix).map((o) => ({
      key: o.Key!,
      name: o.Key!.split("/").pop() ?? o.Key!,
      size: o.Size ?? 0,
      lastModified: o.LastModified?.toISOString() ?? null,
    })) ?? [];

  return NextResponse.json({ folder, prefix, folders, items });
}


