(function () {
  'use strict';

  // DOM Elements
  const tableBody = document.getElementById('manageTableBody');
  const tableWrap = document.getElementById('manageTableWrap');
  const loadingState = document.getElementById('manageLoadingState');
  const errorState = document.getElementById('manageErrorState');
  const errorMessage = document.getElementById('manageErrorMessage');
  const emptyState = document.getElementById('manageEmptyState');
  const countLabel = document.getElementById('manageCountLabel');
  const alertContainer = document.getElementById('alertContainer');

  const searchInput = document.getElementById('manageSearchInput');
  const subjectFilter = document.getElementById('manageSubjectFilter');
  const difficultyFilter = document.getElementById('manageDifficultyFilter');
  const refreshBtn = document.getElementById('refreshTableBtn');

  // Form & Modals
  const resourceModalEl = document.getElementById('resourceModal');
  const resourceModal = new bootstrap.Modal(resourceModalEl);
  const resourceModalLabel = document.getElementById('resourceModalLabel');
  const resourceForm = document.getElementById('resourceForm');
  const modalFormAlert = document.getElementById('modalFormAlert');
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const emptyAddBtn = document.getElementById('emptyAddBtn');
  const saveResourceBtn = document.getElementById('saveResourceBtn');
  const saveSpinner = document.getElementById('saveSpinner');
  const saveBtnText = document.getElementById('saveBtnText');

  const deleteModalEl = document.getElementById('deleteModal');
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteTargetTitle = document.getElementById('deleteTargetTitle');
  const deleteTargetMeta = document.getElementById('deleteTargetMeta');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteSpinner = document.getElementById('deleteSpinner');

  let allResources = [];
  let pendingDeleteId = null;

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
    });
  }

  function showAlert(message, type = 'success') {
    const alertId = 'alert-' + Date.now();
    const iconClass = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
    const alertHtml = `
      <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
        <i class="bi ${iconClass} me-2"></i>${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    alertContainer.innerHTML = alertHtml;
    setTimeout(() => {
      const el = document.getElementById(alertId);
      if (el) {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(el);
        bsAlert.close();
      }
    }, 5000);
  }

  function getFilteredResources() {
    const term = (searchInput.value || '').trim().toLowerCase();
    const subject = subjectFilter.value;
    const difficulty = difficultyFilter.value;

    return allResources.filter((item) => {
      const matchesSubject = !subject || (item.subject || '').toLowerCase() === subject.toLowerCase();
      const matchesDifficulty = !difficulty || (item.difficulty || '').toLowerCase() === difficulty.toLowerCase();
      const text = `${item.title || ''} ${item.description || ''} ${item.keyword || ''} ${item.subject || ''}`.toLowerCase();
      const matchesSearch = !term || text.includes(term);

      return matchesSubject && matchesDifficulty && matchesSearch;
    });
  }

  function renderTable() {
    const filtered = getFilteredResources();

    if (allResources.length === 0) {
      tableWrap.hidden = true;
      emptyState.hidden = false;
      countLabel.textContent = '0 resources in database';
      return;
    }

    if (filtered.length === 0) {
      tableWrap.hidden = false;
      emptyState.hidden = true;
      countLabel.textContent = `0 of ${allResources.length} resources matched`;
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            <i class="bi bi-search me-1"></i> No resources match the current filter.
          </td>
        </tr>
      `;
      return;
    }

    tableWrap.hidden = false;
    emptyState.hidden = true;
    countLabel.textContent = `Showing ${filtered.length} of ${allResources.length} resources`;

    tableBody.innerHTML = filtered.map((res) => {
      const diffClass =
        (res.difficulty || '').toLowerCase() === 'beginner'
          ? 'bg-success-subtle text-success border border-success-subtle'
          : (res.difficulty || '').toLowerCase() === 'intermediate'
          ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
          : 'bg-danger-subtle text-danger border border-danger-subtle';

      const keywords = (res.keyword || '')
        .split(/,\s*/)
        .filter(Boolean)
        .slice(0, 3)
        .map((k) => `<span class="badge bg-light text-dark border me-1">${escapeHtml(k)}</span>`)
        .join('');

      return `
        <tr>
          <td class="text-muted small">#${escapeHtml(res.id)}</td>
          <td>
            <strong>${escapeHtml(res.title)}</strong>
            <p class="text-muted small mb-0 text-truncate" style="max-width: 340px;">${escapeHtml(res.description || 'No description provided.')}</p>
          </td>
          <td><span class="badge bg-light text-dark border">${escapeHtml(res.subject)}</span></td>
          <td>${keywords || '<span class="text-muted small">-</span>'}</td>
          <td><span class="badge ${diffClass}">${escapeHtml(res.difficulty)}</span></td>
          <td><small class="text-muted">${escapeHtml(res.resource_type || 'Article / Guide')}</small></td>
          <td>
            <a href="${escapeHtml(res.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm" title="Open external link">
              <i class="bi bi-box-arrow-up-right"></i>
            </a>
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary edit-resource-btn" data-id="${res.id}" title="Edit this resource">
                <i class="bi bi-pencil me-1"></i>Edit
              </button>
              <button class="btn btn-outline-danger delete-resource-btn" data-id="${res.id}" title="Delete this resource">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadResources() {
    loadingState.hidden = false;
    errorState.hidden = true;
    emptyState.hidden = true;
    tableWrap.hidden = true;

    try {
      const response = await fetch('/api/resources');
      if (!response.ok) {
        throw new Error(`Failed to fetch resources (HTTP ${response.status})`);
      }
      const data = await response.json();
      allResources = Array.isArray(data) ? data : data.data || [];
      renderTable();
    } catch (err) {
      console.error('Failed to load resources:', err);
      errorMessage.textContent = err.message || 'Could not connect to the database.';
      errorState.hidden = false;
      countLabel.textContent = 'Connection error';
    } finally {
      loadingState.hidden = true;
    }
  }

  function resetForm() {
    resourceForm.reset();
    document.getElementById('modalResourceId').value = '';
    modalFormAlert.classList.add('d-none');
    modalFormAlert.textContent = '';
    resourceModalLabel.textContent = 'Add Learning Resource';
    saveBtnText.textContent = 'Save Resource';
  }

  function openEditModal(resource) {
    resetForm();
    resourceModalLabel.textContent = 'Edit Learning Resource #' + resource.id;
    saveBtnText.textContent = 'Update Resource';

    document.getElementById('modalResourceId').value = resource.id;
    document.getElementById('modalTitle').value = resource.title || '';
    document.getElementById('modalSubject').value = resource.subject || '';
    document.getElementById('modalDifficulty').value = resource.difficulty || '';
    document.getElementById('modalResourceType').value = resource.resource_type || 'Article / Guide';
    document.getElementById('modalKeyword').value = resource.keyword || '';
    document.getElementById('modalUrl').value = resource.url || '';
    document.getElementById('modalDescription').value = resource.description || '';

    resourceModal.show();
  }

  // Event Listeners
  if (openAddModalBtn) openAddModalBtn.addEventListener('click', resetForm);
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', resetForm);
  if (refreshBtn) refreshBtn.addEventListener('click', loadResources);
  if (searchInput) searchInput.addEventListener('input', renderTable);
  if (subjectFilter) subjectFilter.addEventListener('change', renderTable);
  if (difficultyFilter) difficultyFilter.addEventListener('change', renderTable);

  // Table action clicks (Edit / Delete)
  tableBody.addEventListener('click', async function (event) {
    const editBtn = event.target.closest('.edit-resource-btn');
    const deleteBtn = event.target.closest('.delete-resource-btn');

    if (editBtn) {
      const id = parseInt(editBtn.dataset.id, 10);
      const res = allResources.find((r) => r.id === id);
      if (res) {
        openEditModal(res);
      } else {
        try {
          const resp = await fetch(`/api/resources/${id}`);
          if (resp.ok) {
            openEditModal(await resp.json());
          }
        } catch (fetchErr) {
          showAlert('Failed to load resource details.', 'danger');
        }
      }
    }

    if (deleteBtn) {
      const id = parseInt(deleteBtn.dataset.id, 10);
      const res = allResources.find((r) => r.id === id);
      pendingDeleteId = id;
      deleteTargetTitle.textContent = res ? res.title : `Resource #${id}`;
      deleteTargetMeta.textContent = res ? `${res.subject} • ${res.difficulty} • ${res.resource_type || ''}` : '';
      deleteModal.show();
    }
  });

  // Confirm Delete
  confirmDeleteBtn.addEventListener('click', async function () {
    if (!pendingDeleteId) return;

    confirmDeleteBtn.disabled = true;
    deleteSpinner.classList.remove('d-none');

    try {
      const resp = await fetch(`/api/resources/${pendingDeleteId}`, {
        method: 'DELETE'
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `Deletion failed with status ${resp.status}`);
      }

      deleteModal.hide();
      showAlert('Resource deleted successfully from PostgreSQL.', 'success');
      await loadResources();
    } catch (delError) {
      console.error('Delete error:', delError);
      showAlert(`Could not delete resource: ${delError.message}`, 'danger');
    } finally {
      confirmDeleteBtn.disabled = false;
      deleteSpinner.classList.add('d-none');
      pendingDeleteId = null;
    }
  });

  // Form Submission (Add or Edit)
  resourceForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    modalFormAlert.classList.add('d-none');

    const id = document.getElementById('modalResourceId').value;
    const isEdit = Boolean(id);

    const payload = {
      title: document.getElementById('modalTitle').value.trim(),
      subject: document.getElementById('modalSubject').value.trim(),
      difficulty: document.getElementById('modalDifficulty').value.trim(),
      resource_type: document.getElementById('modalResourceType').value.trim(),
      keyword: document.getElementById('modalKeyword').value.trim(),
      url: document.getElementById('modalUrl').value.trim(),
      description: document.getElementById('modalDescription').value.trim()
    };

    // Client-side quick validation
    const missing = [];
    if (!payload.title) missing.push('Title');
    if (!payload.subject) missing.push('Subject');
    if (!payload.difficulty) missing.push('Difficulty Level');
    if (!payload.resource_type) missing.push('Resource Type');
    if (!payload.keyword) missing.push('Keywords');
    if (!payload.url) missing.push('Resource URL');

    if (missing.length > 0) {
      modalFormAlert.textContent = 'Please fill in all required fields: ' + missing.join(', ');
      modalFormAlert.classList.remove('d-none');
      return;
    }

    saveResourceBtn.disabled = true;
    saveSpinner.classList.remove('d-none');

    try {
      const url = isEdit ? `/api/resources/${id}` : '/api/resources';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = result.errors ? result.errors.join(' ') : result.message || 'Operation failed.';
        throw new Error(errMsg);
      }

      resourceModal.hide();
      showAlert(
        isEdit
          ? 'Resource updated successfully in PostgreSQL.'
          : 'New resource created successfully in PostgreSQL.',
        'success'
      );
      await loadResources();
    } catch (saveError) {
      console.error('Save error:', saveError);
      modalFormAlert.textContent = saveError.message || 'Failed to save resource.';
      modalFormAlert.classList.remove('d-none');
    } finally {
      saveResourceBtn.disabled = false;
      saveSpinner.classList.add('d-none');
    }
  });

  // Initial load
  loadResources();
})();
