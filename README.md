# Library Management System API

A robust, RESTful Library Management System API built with Node.js, Express, TypeScript, Drizzle ORM, and PostgreSQL. This application provides comprehensive endpoints for managing books, borrowers, and the borrowing process, including tracking checkouts, returns, and overdue books.

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [PostgreSQL](https://www.postgresql.org/) database
- [Docker](https://www.docker.com/) & Docker Compose (Optional, for containerized deployment)

### 🐳 Quick Start (Docker)

The fastest way to run the application and database together is using Docker Compose.

1. **Clone the repository**
2. **Start the infrastructure**
   ```bash
   docker compose up --build -d
   ```

The API will be instantly available at `http://localhost:8080`, and a dedicated PostgreSQL database will be running in the background automatically mapped to port 5432!

---

### 💻 Manual Setup & Installation

1. **Clone the repository and install dependencies**

   ```bash
   npm install
   ```

2. **Database Configuration**
   This application requires a running PostgreSQL instance. Please follow these steps:
   - Ensure you have **PostgreSQL** installed and running on your machine.
   - Create a new, empty database named `library_db` (or a name of your choice). You can do this via your SQL client or terminal: `createdb library_db`.

   Next, create a `.env` file in the root of your project and configure your environment variables to point to your new database:

   ```env
   # Replace 'username' and 'password' with your local PostgreSQL credentials
   DB_URL="postgres://username:password@localhost:5432/library_db?sslmode=disable"
   PORT=8080
   ```

3. **Start the Application**
   The application runs database migrations automatically on startup using Drizzle ORM.

   To run in development mode (compiles TypeScript and runs):

   ```bash
   npm run dev
   ```

   To build and start for production:

   ```bash
   npm run build
   npm start
   ```

The application will be accessible at `http://localhost:8080`.

---

## 🗄️ Database Schema

### ERD Diagram

![Schema Diagram](./Schema.png)

### Schema Details

The database is built using PostgreSQL and interacts via Drizzle ORM. Below is a high-level overview of the tables:

- **`books`**: Stores book details (`id`, `title`, `author`, `isbn`, `available_quantity`, `shelf_location`, etc.). Includes a check constraint to ensure `available_quantity` $\ge 0$.
- **`borrowers`**: Stores borrower information (`id`, `name`, `email`, `registered_date`). Ensures `email` is unique.
- **`borrowing_records`**: A junction table that tracks the borrowing lifecycle (`id`, `book_id`, `borrower_id`, `checkout_date`, `due_date`, `return_date`).

> **Note on Setup Scripts**:
> Database schema migrations are handled programmatically within the application code (`src/index.ts`) via `drizzle-orm/postgres-js/migrator`. Upon starting the server, `await migrate(...)` is executed to synchronize the database schema seamlessly. To generate new migrations in development, you can use `npx drizzle-kit generate`.

---

## 📡 API Documentation

### **Books Endpoints**

#### 1. Create a Book

- **Endpoint**: `POST /api/books`
- **Expected Input** (JSON):
  ```json
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "availableQuantity": 5,
    "shelfLocation": "A1-Shelf"
  }
  ```
- **Expected Output** (201 Created): Returns the created book object with `id`, `createdAt`, and `updatedAt`.

#### 2. Get All Books

- **Endpoint**: `GET /api/books`
- **Expected Output** (200 OK):
  ```json
  {
    "books": [
      {
        "id": "uuid",
        "title": "The Great Gatsby",
        ...
      }
    ]
  }
  ```

#### 3. Search Books

- **Endpoint**: `GET /api/books/search?q={search_term}`
- **Expected Output** (200 OK):
  ```json
  {
    "success": true,
    "count": 1,
    "data": [ ... ]
  }
  ```

#### 4. Update a Book

- **Endpoint**: `PATCH /api/books/:id`
- **Expected Input** (JSON): Any subset of the book fields (e.g., `availableQuantity`).
- **Expected Output** (200 OK): Returns the updated book object.

#### 5. Delete a Book

- **Endpoint**: `DELETE /api/books/:id`
- **Expected Output** (200 OK): Returns the deleted book object.

---

### **Borrowers Endpoints**

#### 1. Create a Borrower

- **Endpoint**: `POST /api/borrowers`
- **Expected Input** (JSON):
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
  ```
- **Expected Output** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john.doe@example.com",
      ...
    }
  }
  ```

#### 2. Get All Borrowers

- **Endpoint**: `GET /api/borrowers`
- **Expected Output** (200 OK): Returns all registered borrowers.

#### 3. Update a Borrower

- **Endpoint**: `PATCH /api/borrowers/:id`
- **Expected Input** (JSON): Any subset of borrower fields (`name`, `email`).
- **Expected Output** (200 OK): Returns the updated borrower details.

#### 4. Delete a Borrower

- **Endpoint**: `DELETE /api/borrowers/:id`
- **Expected Output** (200 OK): Returns `{ "success": true, "message": "Borrower successfully deleted.", "data": {...} }`

---

### **Borrowing & Returns Endpoints**

#### 1. Checkout a Book

- **Endpoint**: `POST /api/borrowings/checkout`
- **Expected Input** (JSON):
  ```json
  {
    "bookId": "uuid-of-book",
    "borrowerId": "uuid-of-borrower"
  }
  ```
- **Expected Output** (201 Created):
  ```json
  {
    "success": true,
    "message": "Book successfully checked out.",
    "data": { ...borrowing_record... }
  }
  ```
  _(Throws 400 if book is out of stock)._

#### 2. Return a Book

- **Endpoint**: `POST /api/borrowings/return`
- **Expected Input** (JSON):
  ```json
  {
    "bookId": "uuid-of-book",
    "borrowerId": "uuid-of-borrower"
  }
  ```
- **Expected Output** (200 OK): Returns the updated borrowing record with the populated `returnDate`.

#### 3. List Borrowed Books for a User

- **Endpoint**: `GET /api/borrowers/:id/borrowed-books`
- **Expected Output** (200 OK): Lists all active (unreturned) books for the specified borrower.

#### 4. List Overdue Books

- **Endpoint**: `GET /api/borrowings/overdue`
- **Expected Output** (200 OK): Lists all borrowing records where the `dueDate` has passed and `returnDate` is null.

---

### **📊 Analytics & CSV Reports Endpoints**


#### 1. Get Borrowing Analytics (JSON)

- **Endpoint**: `GET /api/reports/borrowings?startDate=2024-01-01&endDate=2024-12-31`
- **Expected Output** (200 OK): Returns a full ledger of all borrowing data along with borrower names, book titles, and statuses.

#### 2. Export All Borrowings (CSV Spreadsheet)

- **Endpoint**: `GET /api/reports/borrowings/export?startDate=2024-01-01&endDate=2024-12-31`
- **Expected Output** (200 OK): Triggers a direct download of a `.csv` spreadsheet containing the requested data.

#### 3. Export Last Month's Borrowings

- **Endpoint**: `GET /api/reports/borrowings/last-month`
- **Expected Output** (200 OK): Automatically calculates the previous calendar month and downloads the `.csv` spreadsheet.

#### 4. Export Overdue Borrowings (Last Month)

- **Endpoint**: `GET /api/reports/borrowings/overdue/last-month`
- **Expected Output** (200 OK): Downloads a `.csv` spreadsheet containing _only_ the records from last month that missed their due date and haven't been returned.

---

### **🔒 Security & Validation**

- **UUID Validation**: All IDs passed in URLs or bodies are strictly verified against the standard 36-character UUID specification.
- **Rate Limiting**: To prevent abuse, Native In-Memory Rate Limiters are active:
  - Account Creation (`POST /api/borrowers`): 5 per 15 minutes.
  - Checkout (`POST /api/borrowings/checkout`): 10 per minute.
  


---

## 🩺 System Health

- **Endpoint**: `GET /healthz`
- **Expected Output** (200 OK): Used by orchestrators/monitoring systems to verify application readiness.
