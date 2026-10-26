(function () {
  const storageKey = 'ssr-search-history';
  const loading = document.getElementById('homeRecommendationsLoading');
  const error = document.getElementById('homeRecommendationsError');
  const empty = document.getElementById('homeRecommendationsEmpty');
  const panel = document.getElementById('homeRecommendations');

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value) ? value.slice(0, 20) : [];
    } catch (storageError) {
      try { localStorage.removeItem(storageKey); } catch (removeError) { /* Storage is unavailable. */ }
      return [];
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
  }

  function render(resources) {
    if (!Array.isArray(resources) || resources.length === 0) {
      empty.hidden = false;
      panel.hidden = true;
      return;
    }
    empty.hidden = true;
    panel.hidden = false;
    panel.innerHTML = resources.map(function (resource) {
      const keywords = Array.isArray(resource.keywords) ? resource.keywords.slice(0, 4).join(', ') : resource.subject;
      const score = resource.relevanceScore ? `<span class="recommendation-score">${resource.relevanceScore}% match</span>` : '<span class="recommendation-score">Beginner friendly</span>';
      return `<article class="recommendation-card">
        <div class="recommendation-card-icon"><i class="bi bi-book-half" aria-hidden="true"></i></div>
        <div class="recommendation-card-body">
          <div class="recommendation-card-top"><span class="meta-badge">${escapeHtml(resource.category || resource.subject)}</span>${score}</div>
          <h3>${escapeHtml(resource.title)}</h3>
          <p>${escapeHtml(resource.description)}</p>
          <small>Keywords: ${escapeHtml(keywords)}</small>
          <a class="btn btn-outline-success btn-sm mt-3" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">Open resource <i class="bi bi-arrow-up-right ms-1"></i></a>
        </div>
      </article>`;
    }).join('');
  }

  async function loadRecommendations() {
    loading.hidden = false;
    error.hidden = true;
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: readHistory() })
      });
      if (!response.ok) throw new Error('Recommendation request failed');
      const payload = await response.json();
      render(payload.recommendations);
    } catch (recommendationError) {
      try {
        const fallbackResponse = await fetch('/api/produk');
        if (!fallbackResponse.ok) throw new Error('Fallback request failed');
        render(await fallbackResponse.json());
      } catch (fallbackError) {
        error.hidden = false;
        panel.hidden = true;
        empty.hidden = true;
      }
    } finally {
      loading.hidden = true;
    }
  }

  window.addEventListener('storage', function (event) {
    if (event.key === storageKey) loadRecommendations();
  });
  loadRecommendations();
})();
