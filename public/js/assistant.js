(function () {
  const form = document.getElementById('assistantForm');
  const input = document.getElementById('assistantInput');
  const sendButton = document.getElementById('assistantSend');
  const messages = document.getElementById('assistantMessages');
  const status = document.getElementById('assistantStatus');
  const sendLabel = sendButton ? sendButton.querySelector('.assistant-send-label') : null;
  const sendLoading = sendButton ? sendButton.querySelector('.assistant-send-loading') : null;

  if (!form || !input || !sendButton || !messages || !status) return;

  function addMessage(text, type) {
    const message = document.createElement('div');
    message.className = 'assistant-message ' + type;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function isSafeResourceUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  function addResources(resources) {
    if (!resources.length) return;

    const section = document.createElement('section');
    section.className = 'assistant-resources';
    const heading = document.createElement('h2');
    heading.textContent = 'Recommended resources';
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'assistant-resource-grid';
    resources.forEach(function (resource) {
      if (!resource || typeof resource !== 'object') return;
      const card = document.createElement('article');
      card.className = 'assistant-resource-card';

      const title = document.createElement('h3');
      title.textContent = typeof resource.title === 'string' && resource.title.trim()
        ? resource.title
        : 'Learning resource';
      card.appendChild(title);

      const metadata = [resource.subject, resource.difficulty, resource.resource_type]
        .filter(function (value) { return typeof value === 'string' && value.trim(); });
      if (metadata.length) {
        const meta = document.createElement('div');
        meta.className = 'assistant-resource-meta';
        meta.textContent = metadata.join(' | ');
        card.appendChild(meta);
      }

      if (typeof resource.description === 'string' && resource.description.trim()) {
        const description = document.createElement('p');
        description.textContent = resource.description;
        card.appendChild(description);
      }

      if (typeof resource.url === 'string' && resource.url.trim() &&
          isSafeResourceUrl(resource.url.trim())) {
        const link = document.createElement('a');
        link.className = 'btn btn-outline-success btn-sm';
        link.href = resource.url.trim();
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open resource';
        card.appendChild(link);
      }
      grid.appendChild(card);
    });

    if (grid.children.length) {
      section.appendChild(grid);
      messages.appendChild(section);
    }
  }

  function setLoading(isLoading) {
    sendButton.disabled = isLoading;
    input.disabled = isLoading;
    sendLabel.hidden = isLoading;
    sendLoading.hidden = !isLoading;
    if (isLoading) {
      status.textContent = 'The assistant is thinking...';
      status.hidden = false;
    }
  }

  function showError(message) {
    status.textContent = message;
    status.className = 'assistant-status assistant-status-error';
    status.hidden = false;
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message || sendButton.disabled) {
      if (!message) {
        showError('Please enter a question before sending.');
        input.focus();
      }
      return;
    }

    status.hidden = true;
    addMessage(message, 'assistant-message-user');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });
      let payload;
      try {
        payload = await response.json();
      } catch (parseError) {
        throw new Error('The server returned an unexpected response.');
      }

      if (!response.ok) {
        const errorMessage = typeof payload.message === 'string'
          ? payload.message
          : typeof payload.reply === 'string' ? payload.reply : 'The request could not be completed.';
        throw new Error(errorMessage);
      }
      if (!payload || payload.success !== true || typeof payload.reply !== 'string' ||
          !Array.isArray(payload.resources)) {
        throw new Error('The assistant returned an unexpected response.');
      }

      addMessage(payload.reply, 'assistant-message-ai');
      addResources(payload.resources);
      input.value = '';
      status.hidden = true;
    } catch (error) {
      const messageText = error instanceof TypeError
        ? 'We could not reach the assistant. Please check your connection and try again.'
        : error.message;
      showError(messageText || 'The assistant is unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    sendMessage();
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
})();
