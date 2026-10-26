function renderHomePage(request, response) {
  response.render('home', {
    pageTitle: 'Smart Student Resource Recommender'
  });
}

module.exports = {
  renderHomePage
};
