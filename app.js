// ===============================
// PAGE SWITCHING
// ===============================
const pages = ['home', 'privacy', 'laws', 'protect', 'news', 'resources'];
const navIds = { privacy: 'nav-privacy', laws: 'nav-laws', protect: 'nav-protect', news: 'nav-news', resources: 'nav-resources' };
let newsLoaded = false;
let currentFilter = 'all';
let allArticles = [];
let allDebates = [];

function showPage(name) {
  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.remove('active');
  });
  Object.values(navIds).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });
  const target = document.getElementById('page-' + name);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (navIds[name]) {
    document.getElementById(navIds[name]).classList.add('active');
  }
  // Auto-fetch news on first visit to news page
  if (name === 'news' && !newsLoaded) {
    fetchNews();
  }
}

// ===============================
// FILTER
// ===============================
function setFilter(btn, topic) {
  document.querySelectorAll('.topic-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = topic;
  renderArticles();
}

// ===============================
// LIVE NEWS FETCH
// ===============================
const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

async function fetchNews() {
  const grid = document.getElementById('news-grid-live');
  const loading = document.getElementById('news-loading');
  const error = document.getElementById('news-error');
  const refreshBtn = document.getElementById('refresh-btn');

  grid.innerHTML = '';
  error.style.display = 'none';
  loading.style.display = 'block';
  refreshBtn.disabled = true;
  refreshBtn.textContent = '↻ Loading…';

  const prompt = `Today is ${today}. You are a news summarizer for a youth data privacy education website aimed at California teenagers.

Generate a JSON object with exactly this structure — no markdown, no explanation, just raw JSON:

{
  "articles": [
{
  "id": 1,
  "category": "california",
  "tag": "California Laws",
  "tagColor": "purple",
  "headline": "...",
  "summary": "2-3 sentence plain-English summary of a real or highly plausible recent development in California data privacy law (CCPA, CPRA, CPPA enforcement, Age-Appropriate Design Code, etc.). Write for a 16-year-old. Be specific and current.",
  "date": "approximate date or timeframe",
  "sourceLabel": "source name",
  "sourceUrl": "https://..."
},
{
  "id": 2,
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
  "id": 3,
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
  "id": 4,
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
  "id": 5,
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
  "id": 6,
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
  "title": "...",
  "summary": "2-3 sentence summary of the biggest current ongoing debate in data privacy or online safety that affects young people. Be specific and current to ${today}."
},
{
  "num": "02",
  "title": "...",
  "summary": "..."
},
{
  "num": "03",
  "title": "...",
  "summary": "..."
},
{
  "num": "04",
  "title": "...",
  "summary": "..."
}
  ]
}

Make every article and debate feel fresh, current, and specific to what's actually happening in data privacy as of ${today}. Vary the topics. Use real organizations, laws, and company names where appropriate.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const raw = data.content.map(i => i.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    allArticles = parsed.articles || [];
    allDebates = parsed.debates || [];
    newsLoaded = true;

    loading.style.display = 'none';
    renderArticles();
    renderDebates();

    // Update timestamp
    const now = new Date();
    document.getElementById('last-updated').innerHTML =
      `<span class="live-badge"><span class="live-dot"></span>Live</span> Updated ${now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;

  } catch (err) {
    loading.style.display = 'none';
    error.style.display = 'block';
    console.error('News fetch error:', err);
  }

  refreshBtn.disabled = false;
  refreshBtn.textContent = '↻ Refresh';
}

// ===============================
// RENDER ARTICLES
// ===============================
const tagColorMap = {
  purple: 'purple',
  navy: 'navy',
  green: 'green',
  red: 'red'
};

function renderArticles() {
  const grid = document.getElementById('news-grid-live');
  const filtered = currentFilter === 'all'
    ? allArticles
    : allArticles.filter(a => a.category === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; font-family:'Poppins',sans-serif; color:#999;">No articles for this filter yet. Try refreshing.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(a => `
    <div class="news-card">
      <div class="news-card-header">
        <span class="news-tag ${tagColorMap[a.tagColor] || 'purple'}">${a.tag}</span>
        <h3>${a.headline}</h3>
      </div>
      <p>${a.summary}</p>
      <div class="news-card-footer">
        <span>${a.date}</span>
        ${a.sourceUrl ? `<a href="${a.sourceUrl}" target="_blank" class="read-more">${a.sourceLabel || 'Source'} →</a>` : ''}
      </div>
    </div>
  `).join('');
}

// ===============================
// RENDER DEBATES
// ===============================
function renderDebates() {
  const container = document.getElementById('hot-topics-live');
  if (!allDebates.length) return;
  container.innerHTML = `<div class="hot-topics">${
    allDebates.map((d, i) => `
      <div class="hot-topic" style="${i===1?'border-left-color:var(--navy)':i===2?'border-left-color:var(--green)':i===3?'border-left-color:#c0392b':''}">
        <div class="ht-num">${d.num}</div>
        <div class="ht-content">
          <h4>${d.title}</h4>
          <p>${d.summary}</p>
        </div>
      </div>
    `).join('')
  }</div>`;
}
