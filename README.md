# Smart Student Resource Recommender (SSR)

A database-driven web application built with **Node.js, Express, EJS, and PostgreSQL** that helps students discover, manage, and receive recommendations for curated learning resources.

---

## Features

- **Resource Discovery (`/resources`)**: Filter learning resources by subject, difficulty, and keywords with real-time relevance calculation.
- **Resource Management (`/manage`)**: Complete CRUD interface (Create, Read, Update, Delete) connected directly to PostgreSQL.
- **Personalized Recommendations (`/`)**: Algorithmic resource ranking based on recent browser search patterns.
- **Search History (`/history`)**: Client-side history stored in browser `localStorage` with re-search and per-entry deletion.
- **RESTful API (`/api/resources`)**: Parameterized PostgreSQL queries with robust validation and HTTP status codes.
- **Request Logging & Error Handling**: Centralized request logger and error handling middleware.

---

## Requirements

- **Node.js** 18 or newer
- **npm**
- **PostgreSQL** 14+ (Local or Docker)

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and adjust your PostgreSQL credentials:

```bash
cp .env.example .env
```

Example `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=student_resource_recommender
```

### 3. Initialize PostgreSQL Database

Run the database initialization script to create the `resources` table and seed initial test records:

```bash
npm run db:init
```

Alternatively, run the SQL scripts in `database/` directly in `psql`:

```bash
psql -U postgres -d student_resource_recommender -f database/schema.sql
psql -U postgres -d student_resource_recommender -f database/seed.sql
```

### 4. Start the Application

Development mode (with auto-restart via nodemon):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Application Architecture (MVC)

```text
config/
  db.js                 PostgreSQL pg.Pool connection manager
models/
  resourceModel.js      PostgreSQL query methods (findAll, findById, create, update, delete)
controllers/
  apiController.js      REST API controllers and validation logic
  webController.js      Page-rendering controllers for EJS views
routes/
  apiRoutes.js          API route definitions (/api/resources, /api/status, etc.)
  webRoutes.js          Web page route definitions (/, /resources, /manage, /history)
views/
  home.ejs              Home dashboard with recommendations
  resources.ejs         Resource discovery library
  manage.ejs            Manage resources CRUD interface
  history.ejs           Search history page
  partials/             Modular EJS partials (sidebar, chatbot, layoutStart, layoutEnd, footer)
public/
  css/style.css         Custom styles and responsive layout
  js/manage.js          Client-side AJAX controller for CRUD operations
  js/resources.js       Client-side resource filtering and history saving
  js/home.js            Client-side recommendation loader
  js/history.js         Client-side search history table manager
  js/app.js             Mobile sidebar and study assistant widget
database/
  schema.sql            PostgreSQL table definition
  seed.sql              Initial dataset for testing
  initDb.js             Automated database initialization runner
middlewares/
  requestLogger.js      Timestamped HTTP request logger
  errorHandler.js       Centralized error handler
app.js                  Express application entry point
```

---

## Database Schema

Table name: `resources`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Unique resource identifier |
| `title` | VARCHAR(255) | NOT NULL | Title of the learning resource |
| `subject` | VARCHAR(100) | NOT NULL | Academic subject |
| `keyword` | VARCHAR(255) | NOT NULL | Comma-separated keywords/topics |
| `difficulty` | VARCHAR(30) | NOT NULL | `Beginner`, `Intermediate`, or `Advanced` |
| `resource_type` | VARCHAR(50) | NOT NULL | `Video Tutorial`, `Article / Guide`, `Interactive Lab`, etc. |
| `description` | TEXT | | Detailed resource overview |
| `url` | TEXT | NOT NULL | Valid HTTP/HTTPS external link |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

---

## REST API Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/status` | Service health & PostgreSQL connection check | `200` |
| `GET` | `/api/resources` | Retrieve all resources (supports `?subject=`, `?keyword=`, `?difficulty=`, `?sort=`) | `200` |
| `GET` | `/api/resources/:id` | Retrieve a single resource by ID | `200`, `400`, `404` |
| `POST` | `/api/resources` | Create a new learning resource in PostgreSQL | `201`, `400` |
| `PUT` | `/api/resources/:id` | Update an existing resource in PostgreSQL | `200`, `400`, `404` |
| `DELETE` | `/api/resources/:id` | Delete a resource from PostgreSQL | `200`, `400`, `404` |
| `POST` | `/api/recommendations` | Generate personalized recommendations from PostgreSQL catalog | `200`, `400` |

### Sample `POST /api/resources` Request

```json
{
  "title": "Mastering PostgreSQL Queries",
  "subject": "Computer Science",
  "keyword": "postgresql, sql, performance, indexing",
  "difficulty": "Intermediate",
  "resource_type": "Article / Guide",
  "description": "Learn query analysis, EXPLAIN ANALYZE, and indexing techniques.",
  "url": "https://example.com/ssr/postgresql-guide"
}
```

---

## License

ISC License. Academic project for Web Application Programming.
