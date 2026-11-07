(function () {
  'use strict';

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
    const text = `${resource.title || ''} ${resource.description || ''} ${resource.subject || ''} ${resource.keyword || ''}`.toLowerCase();
    return text.includes(query) ? 1 : 0;
  }

  function renderResources() {
    const query = keyword.value.trim().toLowerCase();
    let filtered = allResources.filter(function (resource) {
      const text = `${resource.title || ''} ${resource.description || ''} ${resource.subject || ''} ${resource.keyword || ''}`.toLowerCase();
      const matchesSubject = !subject.value || (resource.subject || '').toLowerCase() === subject.value.toLowerCase();
      const matchesDifficulty = !difficulty.value || (resource.difficulty || '').toLowerCase() === difficulty.value.toLowerCase();
      const matchesKeyword = !query || text.includes(query);

      return matchesSubject && matchesDifficulty && matchesKeyword;
    });

    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };

    filtered.sort(function (a, b) {
      if (sort.value === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sort.value === 'difficulty') {
        const orderA = difficultyOrder[(a.difficulty || '').toLowerCase()] || 4;
        const orderB = difficultyOrder[(b.difficulty || '').toLowerCase()] || 4;
        if (orderA !== orderB) return orderA - orderB;
        return (a.title || '').localeCompare(b.title || '');
      }
      return relevance(b) - relevance(a);
    });

    count.textContent = `${filtered.length} resource${filtered.length === 1 ? '' : 's'} found`;
    if (!filtered.length) {
      results.innerHTML =
        '<div class="state-card"><i class="bi bi-search empty-icon"></i><h2>No matching resources</h2><p>Try a different subject, keyword, or difficulty level.</p></div>';
      return;
    }

    results.innerHTML = filtered
      .map(function (resource) {
        const type =
          resource.resource_type ||
          (/video|tutorial/i.test(resource.title) ? 'Video Tutorial' : 'Article / Guide');
        const isVideo = /video|tutorial/i.test(type) || /video|tutorial/i.test(resource.title);
        const score = relevance(resource);

        return `<article class="resource-card">
        <div class="resource-thumb ${isVideo ? 'video' : ''}">
          <i class="bi ${isVideo ? 'bi-play-circle' : 'bi-file-earmark-text'}" aria-hidden="true"></i>
        </div>
        <div class="resource-content">
          <h2>${escapeHtml(resource.title)}</h2>
          <div class="resource-meta">
            <span class="meta-badge"><i class="bi bi-tag me-1"></i>${escapeHtml(resource.subject)}</span>
            <span class="meta-badge"><i class="bi bi-file-earmark me-1"></i>${escapeHtml(type)}</span>
            <span class="meta-badge difficulty">${escapeHtml(resource.difficulty)}</span>
          </div>
          <p>${escapeHtml(resource.description || 'No description available.')}</p>
        </div>
        <div class="resource-action">
          ${score ? `<div class="relevance"><i class="bi bi-check-circle me-1"></i>Relevant to search</div>` : ''}
          <a class="btn btn-outline-success btn-sm" href="${escapeAttribute(resource.url)}" target="_blank" rel="noopener noreferrer">
            <i class="bi bi-box-arrow-up-right me-1"></i>Open Resource
          </a>
        </div>
      </article>`;
      })
      .join('');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
    });
  }
  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  async function loadResources() {
    loading.hidden = false;
    error.hidden = true;
    try {
      const response = await fetch('/api/resources');
      if (!response.ok) throw new Error('Resource request failed');
      const data = await response.json();
      allResources = Array.isArray(data) ? data : data.data || [];
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
      try {
        localStorage.removeItem('ssr-search-history');
      } catch (removeError) {
        /* Storage is unavailable. */
      }
      return [];
    }
  }

  function saveSearchToHistory() {
    const history = readHistory();
    const subVal = subject.value || '';
    const kwVal = keyword.value.trim();
    const diffVal = difficulty.value || '';

    // Only record if at least one field has input
    if (!subVal && !kwVal && !diffVal) return;

    const search = {
      subject: subVal,
      keyword: kwVal,
      difficulty: diffVal,
      createdAt: new Date().toISOString()
    };
    const searchKey = `${search.subject}|${search.keyword.toLowerCase()}|${search.difficulty}`;
    const deduplicated = history.filter(function (entry) {
      return (
        `${entry.subject || ''}|${(entry.keyword || '').trim().toLowerCase()}|${entry.difficulty || ''}` !==
        searchKey
      );
    });
    deduplicated.unshift(search);
    try {
      localStorage.setItem('ssr-search-history', JSON.stringify(deduplicated.slice(0, 20)));
    } catch (storageError) {
      /* Storage is unavailable. */
    }
  }

  // If user arrived with search parameters (from Home page or direct link), record to history
  if (subject.value || keyword.value || difficulty.value) {
    saveSearchToHistory();
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
