function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const isApiRequest = request.originalUrl.startsWith('/api');

  if (isApiRequest) {
    return response.status(statusCode).json({
      status: 'error',
      message: statusCode === 500 ? 'Internal server error' : error.message
    });
  }

  return response.status(statusCode).send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Something went wrong | SSR</title>
      </head>
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>We could not complete your request. Please try again later.</p>
        </main>
      </body>
    </html>
  `);
}

module.exports = errorHandler;
