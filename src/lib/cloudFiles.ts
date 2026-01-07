export type ListedFile = {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
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

  return (await res.json()) as { folder: string; prefix: string; items: ListedFile[] };
}


