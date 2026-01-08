export type ListedFile = {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
  path?: string;
};

export async function listFolder(folder: string) {
  const res = await fetch(`/api/files/list?folder=${encodeURIComponent(folder)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `List failed: ${res.status}`);
    } catch {
      throw new Error(raw || `List failed: ${res.status}`);
    }
  }
  return (await res.json()) as { folder: string; prefix: string; items: ListedFile[] };
}

export async function createUploadUrl(folder: string, file: File) {
  const res = await fetch("/api/files/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      folder,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Upload route failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Upload route failed: ${res.status}`);
    }
  }
  return (await res.json()) as { key: string; url: string; method: "PUT" };
}

export async function presignDownload(params: { key: string; disposition?: "inline" | "attachment" }) {
  const res = await fetch("/api/files/presign-get", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Presign download failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Presign download failed: ${res.status}`);
    }
  }
  return (await res.json()) as {
    key: string;
    url: string;
    method: "GET";
    disposition?: "inline" | "attachment";
  };
}

export async function deleteFile(params: { key: string }) {
  const res = await fetch("/api/files/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Delete failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Delete failed: ${res.status}`);
    }
  }
  return (await res.json()) as { ok: true; key: string };
}


