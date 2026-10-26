# Smart Student Resource Recommender (SSR)

Week 7 foundation for a web application that will help students discover learning resources. This version uses fictional temporary sample data only. It does not connect to a database or implement the recommendation algorithm yet.

## Requirements

- Node.js 18 or newer
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Copy `.env.example` to `.env` and set `PORT`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in a browser.

## API endpoints

### `GET /api/status`

Returns the service health status:

```json
{
  "status": "ok",
  "message": "SSR API is running"
}
```

### `GET /api/produk`

Returns five fictional, temporary learning-resource objects. Each object includes `id`, `title`, `description`, `subject`, `difficulty`, and `url`.

## Project structure

```text
config/                 Configuration modules
models/                 Future data models
middlewares/            Request logger and centralized error handler
controllers/            Web and API controller logic
routes/                 Web and API route definitions
views/                  EJS server-rendered pages and partials
utils/                  Future shared utilities
public/css/             Stylesheets
public/js/              Browser JavaScript
public/images/          Image assets
app.js                  Express application entry point
```

## Available command

- `npm run dev` - Start the server with Nodemon for development.
