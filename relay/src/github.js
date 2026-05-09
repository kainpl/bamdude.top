// GitHub Issues API integration. Builds a markdown issue body from the
// BamDude submission and POSTs it via the configured PAT.

const TITLE_MAX = 80;

function buildTitle(description) {
  const firstLine = description.split('\n')[0].trim();
  const truncated = firstLine.length > TITLE_MAX
    ? `${firstLine.slice(0, TITLE_MAX - 1)}…`
    : firstLine;
  return `[bug-report] ${truncated || 'No description'}`;
}

function buildBody({ description, reporterEmail, screenshotUrl, supportInfo }) {
  const parts = [];

  parts.push('## Description');
  parts.push('');
  parts.push(description.trim());
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('_Submitted via the in-app **Report a Bug** button in BamDude. The reporter does not have a GitHub account; replies on this issue are not delivered to them automatically — see the email block below if a follow-up is needed._');

  if (screenshotUrl) {
    parts.push('');
    parts.push('## Screenshot');
    parts.push('');
    parts.push(`![Screenshot](${screenshotUrl})`);
  }

  if (reporterEmail) {
    parts.push('');
    parts.push('<details><summary><strong>Reporter email</strong></summary>');
    parts.push('');
    parts.push('```');
    parts.push(reporterEmail);
    parts.push('```');
    parts.push('');
    parts.push('</details>');
  }

  if (supportInfo) {
    const recentLogs = supportInfo.recent_logs;
    const supportInfoNoLogs = { ...supportInfo };
    delete supportInfoNoLogs.recent_logs;

    parts.push('');
    parts.push('<details><summary><strong>Support info</strong> (app version, OS, integrations, sanitized settings — never includes printer names / serials / IPs / access codes / passwords / emails / API keys / hostnames / usernames)</summary>');
    parts.push('');
    parts.push('```json');
    parts.push(JSON.stringify(supportInfoNoLogs, null, 2));
    parts.push('```');
    parts.push('');
    parts.push('</details>');

    if (recentLogs && typeof recentLogs === 'string' && recentLogs.trim()) {
      parts.push('');
      parts.push('<details><summary><strong>Recent logs</strong> (last 200 lines, sanitized — printer names / serials / IPs / access codes / cloud emails / usernames redacted)</summary>');
      parts.push('');
      parts.push('```');
      parts.push(recentLogs);
      parts.push('```');
      parts.push('');
      parts.push('</details>');
    }
  }

  return parts.join('\n');
}

export async function createGithubIssue({ repo, pat, description, reporterEmail, screenshotUrl, supportInfo }) {
  const url = `https://api.github.com/repos/${repo}/issues`;
  const body = {
    title: buildTitle(description),
    body: buildBody({ description, reporterEmail, screenshotUrl, supportInfo }),
    labels: ['bug-report', 'from-app'],
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'bamdude-bug-report-relay',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const err = new Error(`GitHub API ${resp.status}: ${text.slice(0, 500)}`);
    err.userMessage = resp.status === 422
      ? 'GitHub rejected the issue payload.'
      : 'GitHub API is unavailable.';
    throw err;
  }

  const data = await resp.json();
  return { issueNumber: data.number, issueUrl: data.html_url };
}
