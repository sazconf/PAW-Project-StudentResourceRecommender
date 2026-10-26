function requestLogger(request, response, next) {
  const startTime = new Date().toISOString();

  response.on('finish', () => {
    console.log(
      `${startTime} ${request.method} ${request.originalUrl} ${response.statusCode}`
    );
  });

  next();
}

module.exports = requestLogger;
