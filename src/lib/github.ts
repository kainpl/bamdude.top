export async function fetchStars(repo: string): Promise<number | null> {
  // Build-time only. Cached by Astro for the duration of the build.
  try {
    const url = `https://api.github.com/repos/${repo}`;
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
