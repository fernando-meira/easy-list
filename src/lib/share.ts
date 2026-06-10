export async function getCategoryNameByToken(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/share/${token}`);
    if (!res.ok) return null;
    const { categoryName } = await res.json();
    return categoryName ?? null;
  } catch {
    return null;
  }
}
