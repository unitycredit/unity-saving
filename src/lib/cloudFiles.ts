export type ListedFile = {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
};

export type ListedFolder = {
  name: string;
  path: string; // path without UNITY_S3_PREFIX (e.g. "Documents/Receipts")
  prefix: string; // full S3 prefix (with UNITY_S3_PREFIX if set)
};

export async function listFolder(folder: string) {
  const res = await fetch(`/api/files/list?folder=${encodeURIComponent(folder)}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `List failed: ${res.status}`);
  }

  return (await res.json()) as {
    folder: string;
    prefix: string;
    folders: ListedFolder[];
    items: ListedFile[];
  };
}

export async function presignUpload(params: {
  folder: string;
  fileName: string;
  contentType?: string;
}) {
  const res = await fetch("/api/files/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Presign upload failed: ${res.status}`);
  }
  return (await res.json()) as { key: string; url: string; method: "PUT" };
}

export async function presignDownload(params: { key: string }) {
  const res = await fetch("/api/files/presign-get", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Presign download failed: ${res.status}`);
  }
  return (await res.json()) as { key: string; url: string; method: "GET" };
}


