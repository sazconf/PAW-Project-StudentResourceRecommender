(function () {
  const form = document.getElementById('resourceFilterForm');
  const subject = document.getElementById('resourceSubject');
  const keyword = document.getElementById('resourceKeyword');
  const difficulty = document.getElementById('resourceDifficulty');
  const sort = document.getElementById('sortResources');
  const results = document.getElementById('resourceResults');
  const count = document.getElementById('resultCount');
  const loading = document.getElementById('resourceLoading');
  const error = document.getElementById('resourceError');
  let allResources = [];
  let resourcesReady;

  const params = new URLSearchParams(window.location.search);
  subject.value = params.get('subject') || '';
  keyword.value = params.get('keyword') || '';
  difficulty.value = params.get('difficulty') || '';

  function relevance(resource) {
    const query = keyword.value.trim().toLowerCase();
    if (!query) return 0;
    const text = `${resource.title} ${resource.description} ${resource.subject}`.toLowerCase();
    return text.includes(query) ? 1 : 0;
  }

  function renderResources() {
    const query = keyword.value.trim().toLowerCase();
    let filtered = allResources.filter(function (resource) {
      const text = `${resource.title} ${resource.description} ${resource.subject}`.toLowerCase();
      return (!subject.value || resource.subject === subject.value)
        && (!difficulty.value || resource.difficulty === difficulty.value)
        && (!query || text.includes(query));
    });
    filtered.sort(function (a, b) {
      if (sort.value === 'title') return a.title.localeCompare(b.title);
      if (sort.value === 'difficulty') return a.difficulty.localeCompare(b.difficulty);
      return relevance(b) - relevance(a);
    });
    count.textContent = `${filtered.length} resource${filtered.length === 1 ? '' : 's'} found`;
    if (!filtered.length) {
      results.innerHTML = '<div class="state-card"><i class="bi bi-search empty-icon"></i><h2>No matching resources</h2><p>Try a different subject, keyword, or difficulty level.</p></div>';
      return;
    }
    results.innerHTML = filtered.map(function (resource) {
      const isVideo = /video|tutorial/i.test(resource.title);
      const type = isVideo ? 'Video Tutorial' : 'Article / Guide';
      const score = relevance(resource);
      return `<article class="resource-card">
        <div class="resource-thumb ${isVideo ? 'video' : ''}"><i class="bi ${isVideo ? 'bi-play-circle' : 'bi-file-earmark-text'}" aria-hidden="true"></i></div>
        <div class="resource-content"><h2>${escapeHtml(resource.title)}</h2><div class="resource-meta"><span class="meta-badge"><i class="bi bi-file-earmark"></i>${type}</span><span class="meta-badge difficulty">${escapeHtml(resource.difficulty)}</span></div><p>${escapeHtml(resource.description)}</p></div>
        <div class="resource-action">${score ? `<div class="relevance">Relevant to your search</div>` : ''}<a class="btn btn-outline-success btn-sm" href="${escapeAttribute(resource.url)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right me-1"></i>Open Resource</a></div>
      </article>`;
    }).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]; });
  }
  function escapeAttribute(value) { return escapeHtml(value); }

  async function loadResources() {
    loading.hidden = false;
    error.hidden = true;
    try {
      const response = await fetch('/api/produk');
      if (!response.ok) throw new Error('Resource request failed');
      allResources = await response.json();
      renderResources();
    } catch (requestError) {
      error.hidden = false;
      count.textContent = 'Resources unavailable';
    } finally {
      loading.hidden = true;
    }
  }

  function readHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('ssr-search-history') || '[]');
      return Array.isArray(history) ? history : [];
    } catch (storageError) {
      try { localStorage.removeItem('ssr-search-history'); } catch (removeError) { /* Storage is unavailable. */ }
      return [];
    }
  }

  function saveSearchToHistory() {
    const history = readHistory();
    const search = {
      subject: subject.value,
      keyword: keyword.value.trim(),
      difficulty: difficulty.value,
      createdAt: new Date().toISOString()
    };
    const searchKey = `${search.subject}|${search.keyword.toLowerCase()}|${search.difficulty}`;
    const deduplicated = history.filter(function (entry) {
      return `${entry.subject || ''}|${(entry.keyword || '').trim().toLowerCase()}|${entry.difficulty || ''}` !== searchKey;
    });
    deduplicated.unshift(search);
    try { localStorage.setItem('ssr-search-history', JSON.stringify(deduplicated.slice(0, 20))); } catch (storageError) { /* Storage is unavailable. */ }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    await resourcesReady;
    const nextParams = new URLSearchParams(new FormData(form));
    saveSearchToHistory();
    window.history.replaceState({}, '', `/resources?${nextParams.toString()}`);
    renderResources();
  });
  sort.addEventListener('change', renderResources);
  resourcesReady = loadResources();
})();
