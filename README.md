# Smart Student Resource Recommender (SSR)

A web application built with **Node.js, Express, EJS, and PostgreSQL** designed to help university students discover, organize, and receive personalized recommendations for learning materials across various subjects and skill levels.

---

## Weekly Implementation Breakdown

This project has been developed incrementally over two milestones:

### Week 7 — Express MVC Foundation & Frontend Discovery

The goal of Week 7 was to establish the application architecture, server-rendered views, routing, and user interface:

- **Express MVC Architecture:** Configured the core Express server with organized separation of concerns (`controllers/`, `routes/`, `views/`, `middlewares/`, `public/`).
- **Server-Side Templating (EJS):** Structured modular view partials (`layoutStart`, `layoutEnd`, `sidebar`, `footer`, `chatbot`) with a responsive CSS layout (Bootstrap 5 + custom green aesthetic).
- **Home Dashboard (`/`):** Designed an introductory hero section, study preferences search form, recommendation card grid, example topic shortcuts, and a "How it works" guide.
- **Find Resources Page (`/resources`):** Interactive resource library interface supporting filtering by Subject, Difficulty, and Keyword, along with sorting controls.
- **Search History (`/history`):** Client-side search activity logger stored in browser `localStorage` (`ssr-search-history`), enabling search re-execution and single-item/bulk deletion.
- **Recommendation Logic Foundation (`utils/recommendationService.js`):** Tokenization, query-overlap scoring, and recency-weighted recommendation algorithm.
- **Study Assistant Interface:** Floating interactive chat widget preview (`views/partials/chatbot.ejs` and `public/js/app.js`).
- **Custom Middleware:**
  - `middlewares/requestLogger.js`: Logs incoming HTTP requests with method, path, and response status.
  - `middlewares/errorHandler.js`: Centralized error handler returning HTML error views for web routes and JSON errors for API routes.
- **Health Check API (`GET /api/status`):** Initial service availability endpoint.

---

### Week 8 — PostgreSQL Database Integration & Full CRUD

The goal of Week 8 was to transition from temporary mock data to a persistent **PostgreSQL** relational database with full REST API and frontend CRUD capabilities:

- **PostgreSQL Connection Management (`config/db.js`):**
  - Configured `pg` (node-postgres) using `pg.Pool` for connection reuse.
  - Environment-based configuration loaded via `dotenv` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
  - Implemented health check query `testConnection()` to verify database connectivity.
- **Database Schema & Seeding (`database/`):**
  - `database/schema.sql`: Defines the `resources` table with primary key, constraints, and indexes on `subject` and `difficulty`.
  - `database/seed.sql`: Pre-populates 10 comprehensive learning resources across Mathematics, Web Development, Programming, Computer Science, and Academic Skills.
  - `database/initDb.js`: Automated initialization script executable via `npm run db:init`.
- **Resource Model Layer (`models/resourceModel.js`):**
  - Implemented data-access methods: `findAll`, `findById`, `create`, `update`, `delete`, and `count`.
  - Strictly uses **parameterized SQL queries (`$1, $2, ...`)** to prevent SQL injection.
- **RESTful API CRUD Endpoints (`routes/apiRoutes.js` & `controllers/apiController.js`):**
  - `GET /api/status`: Service health and active PostgreSQL connection status.
  - `GET /api/resources`: Retrieves all resources from PostgreSQL (supports query filters: `?subject=`, `?keyword=`, `?difficulty=`, `?sort=`).
  - `GET /api/resources/:id`: Retrieves a single resource by its primary key ID (returns 404 if not found).
  - `POST /api/resources`: Validates inputs and inserts a new learning resource (returns HTTP 201).
  - `PUT /api/resources/:id`: Validates inputs and updates an existing resource (returns HTTP 200).
  - `DELETE /api/resources/:id`: Permanently deletes a resource from the database.
  - `POST /api/recommendations`: Ranks live PostgreSQL catalog against the user's recent search history.
- **Frontend Management Interface (`/manage`):**
  - Dedicated CRUD management page (`views/manage.ejs` and `public/js/manage.js`).
  - Interactive table displaying title, description, subject, keywords, difficulty, resource type, and external links.
  - **Add Resource Modal:** Interactive form with client-side and server-side validation.
  - **Edit Resource Modal:** Pre-fills existing database values and submits updates via `PUT`.
  - **Delete Confirmation Modal:** Safeguards against accidental deletion before issuing `DELETE`.
  - Dynamic UI updates via `fetch` without full page reloads.
- **Integration with Existing Pages:**
  - Find Resources (`/resources`) now queries live records from PostgreSQL.
  - Personalized Recommendations (`/`) dynamically scores live database records.
- **Automated Verification Suite (`test/verify.js`):**
  - 11 comprehensive automated tests checking DB connection, all CRUD API operations, query filtering, validation errors, and view rendering (`npm test`).

---

## Database Schema

Database Name: `student_resource_recommender`  
Table Name: `resources`

| Column | PostgreSQL Type | Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Unique resource identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Resource title |
| `subject` | `VARCHAR(100)` | `NOT NULL` | Academic subject category |
| `keyword` | `VARCHAR(255)` | `NOT NULL` | Comma-separated search keywords |
| `difficulty` | `VARCHAR(30)` | `NOT NULL` | `Beginner`, `Intermediate`, or `Advanced` |
| `resource_type` | `VARCHAR(50)` | `NOT NULL` | `Video Tutorial`, `Article / Guide`, `Interactive Lab`, etc. |
| `description` | `TEXT` | Default `''` | Summary of the learning resource |
| `url` | `TEXT` | `NOT NULL` | Valid HTTP/HTTPS resource URL |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of record creation |

---

## REST API Reference

| HTTP Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/status` | Health check & database connection probe | `200` |
| `GET` | `/api/resources` | Retrieve resources with optional filters (`subject`, `keyword`, `difficulty`, `sort`) | `200` |
| `GET` | `/api/resources/:id` | Retrieve single resource by ID | `200`, `400`, `404` |
| `POST` | `/api/resources` | Create a new learning resource | `201`, `400` |
| `PUT` | `/api/resources/:id` | Update an existing learning resource | `200`, `400`, `404` |
| `DELETE` | `/api/resources/:id` | Delete a learning resource | `200`, `400`, `404` |
| `POST` | `/api/recommendations` | Generate personalized recommendations using PostgreSQL catalog | `200`, `400` |

---

## Setup and Running

### 1. Requirements

- **Node.js** 18 or newer
- **npm**
- **PostgreSQL** 14+ (running locally on port 5432)

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=student_resource_recommender
```

### 4. Initialize Database & Seed Records

Run the automated script to create the schema and populate initial records:

```bash
npm run db:init
```

### 5. Start the Server

Development mode (with nodemon):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Visit the application at: [http://localhost:3000](http://localhost:3000)

### 6. Run Automated Tests

To run the automated integration test suite:

```bash
npm test
```

---

## Project Structure

```text
config/
  db.js                 PostgreSQL pg.Pool connection manager (Week 8)
database/
  schema.sql            PostgreSQL table definitions and indexes (Week 8)
  seed.sql              Initial dataset for testing (Week 8)
  initDb.js             Automated schema & seed runner (Week 8)
models/
  resourceModel.js      PostgreSQL parameterized query methods (Week 8)
controllers/
  apiController.js      REST API controllers and validation (Week 7 + Week 8)
  webController.js      Page-rendering controllers for EJS views (Week 7 + Week 8)
routes/
  apiRoutes.js          REST API routes (Week 7 + Week 8)
  webRoutes.js          Web page routes (Week 7 + Week 8)
views/
  home.ejs              Dashboard with recommendations (Week 7)
  resources.ejs         Resource discovery library (Week 7)
  manage.ejs            Resource management CRUD interface (Week 8)
  history.ejs           Search history page (Week 7)
  partials/             Modular EJS partials (sidebar, chatbot, layout, footer) (Week 7)
public/
  css/style.css         Stylesheets and responsive layout (Week 7 + Week 8)
  js/manage.js          Client-side CRUD AJAX controller (Week 8)
  js/resources.js       Client-side filtering and search history saving (Week 7 + Week 8)
  js/home.js            Client-side recommendation loader (Week 7 + Week 8)
  js/history.js         Client-side search history table manager (Week 7)
  js/app.js             Mobile navigation and chat assistant widget (Week 7)
middlewares/
  requestLogger.js      Timestamped HTTP request logger (Week 7)
  errorHandler.js       Centralized error handler (Week 7)
test/
  verify.js             Automated integration test suite (Week 8)
app.js                  Express application entry point (Week 7)
.env.example            Template for environment variables (Week 8)
```
