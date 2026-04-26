// Lighthouse CI gate.
//
// Scores reflect production: HTTP/2, brotli, edge cache via Cloudflare in front of nginx.
// Local runs (lhci's static server) lack HTTP/2 and compression and will under-score
// performance by ~3–5 points; this is expected — run against the deployed URL for a
// realistic measurement, or accept local variance and treat the gate as a CI-only check.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost/index.html', 'http://localhost/uk/index.html'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1.0 }],
      },
    },
  },
};
