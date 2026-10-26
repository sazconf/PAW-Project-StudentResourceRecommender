(function () {
  const storageKey = 'ssr-search-history';
  const rows = document.getElementById('historyRows');
  const table = document.getElementById('historyTableContainer');
  const empty = document.getElementById('historyEmpty');
  const clearButton = document.getElementById('clearHistory');

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (error) { return []; }
  }
  function saveHistory(history) {
    try { localStorage.setItem(storageKey, JSON.stringify(history)); } catch (storageError) { return false; }
    return true;
  }
  function render() {
    const history = getHistory();
    table.hidden = history.length === 0;
    empty.hidden = history.length !== 0;
    rows.innerHTML = history.map(function (item, index) {
      const date = new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      const query = new URLSearchParams({ subject: item.subject || '', keyword: item.keyword || '', difficulty: item.difficulty || '' });
      return `<tr><td>${index + 1}</td><td class="history-details"><strong>${escapeHtml(item.keyword || 'All resources')}</strong><div class="history-tags"><span class="history-tag"><i class="bi bi-book"></i>${escapeHtml(item.subject || 'Any subject')}</span><span class="history-tag"><i class="bi bi-search"></i>${escapeHtml(item.keyword || 'Any topic')}</span><span class="history-tag"><i class="bi bi-bar-chart"></i>${escapeHtml(item.difficulty || 'Any level')}</span></div></td><td class="history-date">${date}</td><td><div class="history-actions"><a class="btn btn-primary btn-sm" href="/resources?${query.toString()}"><i class="bi bi-search me-1"></i>Search again</a><div class="dropdown"><button class="btn btn-light btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="More actions for this search"><i class="bi bi-three-dots-vertical"></i></button><ul class="dropdown-menu dropdown-menu-end"><li><a class="dropdown-item" href="/resources?${query.toString()}"><i class="bi bi-pencil me-2"></i>Edit search</a></li><li><button class="dropdown-item delete-history" type="button" data-index="${index}"><i class="bi bi-trash3 me-2"></i>Delete search</button></li></ul></div></div></td></tr>`;
    }).join('');
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]; }); }
  rows.addEventListener('click', function (event) {
    const button = event.target.closest('.delete-history');
    if (!button) return;
    const history = getHistory();
    history.splice(Number(button.dataset.index), 1);
    saveHistory(history);
    render();
  });
  clearButton.addEventListener('click', function () {
    if (getHistory().length && window.confirm('Clear all search history from this browser?')) {
      try { localStorage.removeItem(storageKey); } catch (storageError) { return; }
      render();
    }
  });
  render();
})();
