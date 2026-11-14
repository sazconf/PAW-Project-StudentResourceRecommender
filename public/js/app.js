(function () {
  const sidebar = document.getElementById('mainSidebar');
  const menuButton = document.querySelector('.mobile-menu-button');
  const launcher = document.querySelector('.chatbot-launcher');
  const panel = document.getElementById('chatbotPanel');
  const closeButton = document.querySelector('.chatbot-close');

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
      if (isOpen && closeButton) closeButton.focus();
    });
  }

  if (closeButton && panel && launcher) {
    closeButton.addEventListener('click', function () {
      panel.setAttribute('hidden', '');
      launcher.setAttribute('aria-expanded', 'false');
      launcher.focus();
    });
  }

})();
