// BamDude bug-report relay.
// Receives JSON from BamDude instances (via the in-app `BugReportBubble`
// component), creates a GitHub issue against the configured repo using a
// maintainer-controlled PAT, and returns the issue number + URL. Optional
// screenshot is written to disk and served by nginx at /bug-attachments/.
//
// Environment:
//   GITHUB_PAT             — PAT with `issues:write` on GITHUB_REPO. Required.
//   GITHUB_REPO            — `owner/repo`, default `kainpl/bamdude`.
//   PORT                   — listen port, default 3001.
//   HOST                   — listen host, default 127.0.0.1 (nginx is in front).
//   SCREENSHOT_DIR         — where to save uploaded screenshots, default
//                            /var/lib/bamdude-relay/screenshots.
//   SCREENSHOT_PUBLIC_BASE — public URL prefix nginx serves screenshots from,
//                            default https://bamdude.top/bug-attachments.
//   ALLOWED_ORIGINS        — comma-separated CORS allow-list. Empty = allow
//                            any origin (BamDude installs vary; the X-API-key
//                            equivalent here is the PAT, not the origin).
//   MAX_BODY_BYTES         — hard cap on request body. Default 12 MB
//                            (a 1920×1080 JPEG q=0.7 ≈ 300 KB; 12 MB allows
//                            for an unusually large support_info dump too).
//   RATE_LIMIT_MAX         — max requests per IP per window, default 10.
//   RATE_LIMIT_WINDOW_MIN  — window length in minutes, default 60.

import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { createGithubIssue } from './github.js';

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';
const GITHUB_PAT = process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || 'kainpl/bamdude';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || '/var/lib/bamdude-relay/screenshots';
const SCREENSHOT_PUBLIC_BASE = (process.env.SCREENSHOT_PUBLIC_BASE || 'https://bamdude.top/bug-attachments').replace(/\/$/, '');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 12 * 1024 * 1024);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 10);
const RATE_LIMIT_WINDOW_MIN = Number(process.env.RATE_LIMIT_WINDOW_MIN || 60);

if (!GITHUB_PAT) {
  console.error('GITHUB_PAT is required');
  process.exit(1);
}

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  },
  bodyLimit: MAX_BODY_BYTES,
  trustProxy: true,
});

await app.register(cors, {
  origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});

await app.register(rateLimit, {
  max: RATE_LIMIT_MAX,
  timeWindow: `${RATE_LIMIT_WINDOW_MIN} minutes`,
  keyGenerator: (req) => req.ip,
});

const submissionSchema = {
  type: 'object',
  required: ['description'],
  additionalProperties: false,
  properties: {
    description: { type: 'string', minLength: 1, maxLength: 8000 },
    reporter_email: { type: ['string', 'null'], maxLength: 320 },
    screenshot_base64: { type: ['string', 'null'] },
    support_info: { type: ['object', 'null'], additionalProperties: true },
  },
};

app.get('/health', async () => ({ ok: true, repo: GITHUB_REPO }));

app.post(
  '/api/bug-report',
  { schema: { body: submissionSchema } },
  async (req, reply) => {
    const { description, reporter_email, screenshot_base64, support_info } = req.body;

    let screenshotUrl = null;
    if (screenshot_base64) {
      try {
        const cleaned = screenshot_base64.replace(/^data:[^;]+;base64,/, '');
        const buf = Buffer.from(cleaned, 'base64');
        // Cap at 8 MB after decode — guards against base64-of-a-zip etc.
        if (buf.length > 8 * 1024 * 1024) {
          return reply.code(400).send({ success: false, message: 'Screenshot too large.' });
        }
        const id = `${Date.now()}-${randomUUID()}`;
        const filename = `${id}.jpg`;
        await writeFile(path.join(SCREENSHOT_DIR, filename), buf, { mode: 0o644 });
        screenshotUrl = `${SCREENSHOT_PUBLIC_BASE}/${filename}`;
      } catch (err) {
        req.log.warn({ err }, 'Failed to decode screenshot, continuing without it');
      }
    }

    try {
      const { issueNumber, issueUrl } = await createGithubIssue({
        repo: GITHUB_REPO,
        pat: GITHUB_PAT,
        description,
        reporterEmail: reporter_email || null,
        screenshotUrl,
        supportInfo: support_info || null,
      });
      return { success: true, issue_number: issueNumber, issue_url: issueUrl };
    } catch (err) {
      req.log.error({ err }, 'GitHub issue creation failed');
      return reply.code(502).send({
        success: false,
        message: err.userMessage || 'Failed to create GitHub issue.',
      });
    }
  },
);

app.listen({ port: PORT, host: HOST }).then(() => {
  app.log.info(`bug-report relay listening on http://${HOST}:${PORT} → ${GITHUB_REPO}`);
});
