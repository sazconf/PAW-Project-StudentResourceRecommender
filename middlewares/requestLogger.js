function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function requestLogger(request, response, next) {
  const timestamp = formatTimestamp();

  response.on('finish', () => {
    console.log(
      `[${timestamp}] ${request.method} ${request.originalUrl} ${response.statusCode}`
    );
  });

  next();
}

module.exports = requestLogger;
