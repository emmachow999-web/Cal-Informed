// scripts/generate-news.js
// Uses Google Gemini (free tier) to generate privacy news daily.
// Runs via GitHub Actions and writes a static pages/news.html.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const today = new Date().toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric'
});

// ─── 1. Ask Gemini for news data ─────────────────────────────────────────────

const prompt = `Today is ${today}. You are a news summarizer for a youth data privacy education website aimed at California teenagers.

Generate a JSON object with exactly this structure — no markdown, no code fences, no explanation, just raw JSON:

{
  "articles": [
    {
      "category": "california",
      "tag": "California Laws",
      "tagColor": "purple",
      "headline": "...",
      "summary": "2-3 sentence plain-English summary. Write for a 16-year-old. Be specific and current to ${today}.",
      "date": "approximate date or timeframe",
      "sourceLabel": "source name",
      "sourceUrl": "https://..."
    },
    {
      "category": "minors",
      "tag": "Teen & Minors",
      "tagColor": "green",
      "headline": "...",
      "summary": "...",
      "date": "...",
      "sourceLabel": "...",
      "sourceUrl": "https://..."
    },
    {
      "category": "breaches",
      "tag": "Data Breaches",
      "tagColor": "navy",
      "headline": "...",
      "summary": "...",
      "date": "...",
      "sourceLabel": "...",
      "sourceUrl": "https://..."
    },
    {
      "category": "bigtech",
      "tag": "Big Tech",
      "tagColor": "red",
      "headline": "...",
      "summary": "...",
      "date": "...",
      "sourceLabel": "...",
      "sourceUrl": "https://..."
    },
    {
      "category": "california",
      "tag": "California Laws",
      "tagColor": "purple",
      "headline": "...",
      "summary": "...",
      "date": "...",
      "sourceLabel": "...",
      "sourceUrl": "https://..."
    },
    {
      "category": "minors",
      "tag": "Teen & Minors",
      "tagColor": "green",
      "headline": "...",
      "summary": "...",
      "date": "...",
      "sourceLabel": "...",
      "sourceUrl": "https://..."
    }
  ],
  "debates": [
    {
      "num": "01",
      "borderColor": "var(--purple)",
      "title": "...",
      "summary": "2-3 sentences on a major ongoing privacy debate affecting young people. Be specific to ${today}."
    },
    {
      "num": "02",
      "borderColor": "var(--navy)",
      "title": "...",
      "summary": "..."
    },
    {
      "num": "03",
      "borderColor": "var(--green)",
      "title": "...",
      "summary": "..."
    },
    {
      "num": "04",
      "borderColor": "#c0392b",
      "title": "...",
      "summary": "..."
    }
  ]
}

Make every article and debate feel fresh, current, and specific to data privacy as of ${today}. Use real organizations, laws, and company names where appropriate.`;

console.log(`Fetching news for ${today}...`);

const result = await model.generateContent(prompt);
const raw = result.response.text();
const clean = raw.replace(/```json|```/g, '').trim();
const { articles, debates } = JSON.parse(clean);

console.log(`Got ${articles.length} articles and ${debates.length} debates.`);

// ─── 2. Build HTML snippets ───────────────────────────────────────────────────

const tagColorMap = { purple: 'purple', navy: 'navy', green: 'green', red: 'red' };

function buildArticleCard(a) {
  const colorClass = tagColorMap[a.tagColor] || 'purple';
  return `
        <div class="news-card" data-category="${a.category}">
          <div class="news-card-header">
            <span class="news-tag ${colorClass}">${a.tag}</span>
            <h3>${a.headline}</h3>
          </div>
          <p>${a.summary}</p>
          <div class="news-card-footer">
            <span>${a.date}</span>
            ${a.sourceUrl
              ? `<a href="${a.sourceUrl}" target="_blank" rel="noopener" class="read-more">${a.sourceLabel || 'Source'} →</a>`
              : ''}
          </div>
        </div>`;
}

function buildDebate(d) {
  return `
          <div class="hot-topic" style="border-left-color:${d.borderColor}">
            <div class="ht-num">${d.num}</div>
            <div class="ht-content">
              <h4>${d.title}</h4>
              <p>${d.summary}</p>
            </div>
          </div>`;
}

const articlesHtml = articles.map(buildArticleCard).join('\n');
const debatesHtml  = debates.map(buildDebate).join('\n');

// ─── 3. Write the full static news.html ──────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>News — CalInformed</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>

  <nav class="site-nav">
    <div class="nav-logo" onclick="location.href='../index.html'">Cal<span>Informed</span></div>
    <div class="nav-links">
      <a href="what-is-data-privacy.html" class="nav-btn">What is Data Privacy?</a>
      <a href="california-privacy-laws.html" class="nav-btn">California Privacy Laws</a>
      <a href="protect-yourself.html" class="nav-btn">Protect Yourself</a>
      <a href="news.html" class="nav-btn active">News</a>
      <a href="resources.html" class="nav-btn">Resources</a>
    </div>
  </nav>

  <header class="page-hero">
    <p class="hero-eyebrow">&#x2022; News &amp; Updates &#x2022;</p>
    <h1>What's Happening in <em>Data Privacy</em> Right Now</h1>
    <p>Updated daily by AI — stories across California privacy law, teen safety, data breaches, and Big Tech.</p>
  </header>

  <div class="section">
    <div class="inner">

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:36px; align-items:center;">
        <span style="font-family:'Poppins',sans-serif; font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#999;">Filter:</span>
        <button class="topic-filter active" onclick="filterNews(this,'all')">All Topics</button>
        <button class="topic-filter" onclick="filterNews(this,'california')">California Laws</button>
        <button class="topic-filter" onclick="filterNews(this,'minors')">Teen &amp; Minors</button>
        <button class="topic-filter" onclick="filterNews(this,'breaches')">Data Breaches</button>
        <button class="topic-filter" onclick="filterNews(this,'bigtech')">Big Tech</button>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; flex-wrap:wrap; gap:12px;">
        <div>
          <p class="section-label" style="margin-bottom:4px;">Auto-Updated Feed</p>
          <h2 class="section-title" style="margin-bottom:0;">Latest Privacy News</h2>
        </div>
        <div style="font-family:'Poppins',sans-serif; font-size:0.78rem; color:#999;">
          <span class="live-badge"><span class="live-dot"></span>Last updated: ${today}</span>
        </div>
      </div>

      <div id="news-grid" class="news-grid">
${articlesHtml}
      </div>

    </div>
  </div>

  <div class="section gray">
    <div class="inner">
      <p class="section-label">Ongoing Debates</p>
      <h2 class="section-title">The Biggest Privacy Questions Right Now</h2>
      <p class="section-subtitle">These debates shape the laws of tomorrow — and they affect you directly.</p>
      <div class="hot-topics">
${debatesHtml}
      </div>
      <div class="callout" style="margin-top:32px;">
        <strong>Stay Informed</strong>
        For the most current developments, follow the California Privacy Protection Agency at cppa.ca.gov,
        the Electronic Frontier Foundation at eff.org, and the California AG's privacy page at oag.ca.gov/privacy.
      </div>
    </div>
  </div>

  <footer class="site-footer">
    <div class="footer-logo" onclick="location.href='../index.html'">Cal<span>Informed</span></div>
    <div class="footer-links"><a href="#">Instagram</a><a href="#">GitHub</a><a href="#">Twitter</a></div>
    <div class="footer-copy">© 2025 CalInformed. Informational purposes only. Not legal advice.</div>
  </footer>

  <script>
    function filterNews(btn, category) {
      document.querySelectorAll('.topic-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#news-grid .news-card').forEach(card => {
        card.style.display = (category === 'all' || card.dataset.category === category) ? '' : 'none';
      });
    }
  </script>

</body>
</html>`;

const outPath = join(__dirname, '..', 'pages', 'news.html');
writeFileSync(outPath, html, 'utf8');
console.log(`✅ Written to ${outPath}`);
