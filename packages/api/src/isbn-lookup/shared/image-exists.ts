export async function imageExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Range: "bytes=0-1",
      },
    });

    const contentType = res.headers.get("content-type");

    return Boolean(
      res.ok &&
        contentType &&
        contentType.startsWith("image/"),
    );
  } catch {
    return false;
  }
}