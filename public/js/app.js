(function () {
  const sidebar = document.getElementById('mainSidebar');
  const menuButton = document.querySelector('.mobile-menu-button');
  const launcher = document.querySelector('.chatbot-launcher');
  const panel = document.getElementById('chatbotPanel');
  const closeButton = document.querySelector('.chatbot-close');
  const chatForm = document.querySelector('.chatbot-form');
  const input = document.getElementById('chatbotInput');

  if (menuButton && sidebar) {
    menuButton.addEventListener('click', function () {
      const isOpen = sidebar.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (launcher && panel) {
    launcher.addEventListener('click', function () {
      const isOpen = panel.hasAttribute('hidden');
      if (isOpen) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
      launcher.setAttribute('aria-expanded', String(isOpen));
      if (isOpen && input) input.focus();
    });
  }

  if (closeButton && panel && launcher) {
    closeButton.addEventListener('click', function () {
      panel.setAttribute('hidden', '');
      launcher.setAttribute('aria-expanded', 'false');
      launcher.focus();
    });
  }

  if (chatForm && input) {
    chatForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;
      const messages = document.querySelector('.chatbot-messages');
      const empty = messages.querySelector('.chatbot-empty');
      if (empty) empty.remove();
      const userMessage = document.createElement('p');
      userMessage.className = 'chat-message';
      userMessage.textContent = message;
      messages.appendChild(userMessage);
      const reply = document.createElement('p');
      reply.className = 'chat-message';
      reply.textContent = 'The Study Assistant is a frontend preview. AI responses are not connected yet.';
      messages.appendChild(reply);
      input.value = '';
    });
  }
})();
