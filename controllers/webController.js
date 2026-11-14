function renderHomePage(request, response) {
  response.render('home', {
    pageTitle: 'Smart Student Resource Recommender',
    activePage: 'home'
  });
}

function renderResourcesPage(request, response) {
  response.render('resources', {
    pageTitle: 'Find Learning Resources',
    activePage: 'resources',
    filters: {
      subject: request.query.subject || '',
      keyword: request.query.keyword || '',
      difficulty: request.query.difficulty || ''
    }
  });
}

function renderHistoryPage(request, response) {
  response.render('history', {
    pageTitle: 'Search History',
    activePage: 'history'
  });
}

function renderManagePage(request, response) {
  response.render('manage', {
    pageTitle: 'Manage Resources',
    activePage: 'manage'
  });
}

function renderAssistantPage(request, response) {
  response.render('assistant', {
    pageTitle: 'AI Assistant',
    activePage: 'assistant'
  });
}

module.exports = {
  renderHomePage,
  renderResourcesPage,
  renderHistoryPage,
  renderManagePage,
  renderAssistantPage
};
