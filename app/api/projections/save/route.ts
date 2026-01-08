import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getBucketName, getS3Client, objectKey } from "@/lib/aws/s3";

export const runtime = "nodejs";

function safeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as
      | {
          inputs?: {
            initialDeposit?: number;
            monthlyContribution?: number;
            annualRatePct?: number;
            years?: number;
          };
          results?: {
            totalBalance?: number;
            totalPrincipal?: number;
            totalInterest?: number;
          };
          series?: Array<{ month: number; balance: number; principal: number; interest: number }>;
        }
      | null;

    const now = new Date().toISOString();
    const id = safeId();
    const projection = {
      id,
      userId,
      createdAt: now,
      inputs: body?.inputs ?? null,
      results: body?.results ?? null,
      series: body?.series ?? null,
      kind: "compound_interest_v1",
    };

    const key = objectKey(`projections/${userId}`, `${id}.json`);

    const s3 = getS3Client();
    const bucket = getBucketName();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: "application/json",
        Body: JSON.stringify(projection),
      }),
    );

    return NextResponse.json({ ok: true, id, key });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save projection route error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

