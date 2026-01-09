import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client, normalizeFolder } from "@/lib/aws/s3";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawFolder = (searchParams.get("folder") ?? "Bank Statements").trim();
  const listAll = rawFolder === "__all__" || rawFolder === "*" || rawFolder === "";
  const folder = listAll ? "__all__" : normalizeFolder(rawFolder);

  const prefixEnv = (process.env.UNITY_S3_PREFIX ?? "").trim().replace(/^\/+|\/+$/g, "");
  const envPrefixWithSlash = prefixEnv ? `${prefixEnv}/` : "";
  const prefix = listAll ? envPrefixWithSlash : prefixEnv ? `${prefixEnv}/${folder}/` : `${folder}/`;

  const s3 = getS3Client();
  const bucket = getBucketName();

  const out = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: listAll ? undefined : "/",
      MaxKeys: 200,
    }),
  );

  const folders = listAll
    ? []
    : out.CommonPrefixes?.map((p) => {
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
    out.Contents?.filter((o) => o.Key && o.Key !== prefix).map((o) => {
      const key = o.Key!;
      const withoutEnv =
        envPrefixWithSlash && key.startsWith(envPrefixWithSlash)
          ? key.slice(envPrefixWithSlash.length)
          : key;
      const path = withoutEnv.split("/").slice(0, -1).join("/");

      return {
        key,
        name: key.split("/").pop() ?? key,
        size: o.Size ?? 0,
        lastModified: o.LastModified?.toISOString() ?? null,
        path: listAll ? path : undefined,
      };
    }) ?? [];

  return NextResponse.json({ folder, prefix, folders, items });
}


