import express from "express";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { handlerReadiness } from "./api/readiness.js";
import { middlewareLogResponse, errorMiddleWare } from "./api/middleware.js";
import { config } from "./config.js";
import {
  handlerCreateBook,
  handlerGetBooks,
  handlerSearchBooks,
  handlerBooksUpdate,
  handlerDeleteBook,
} from "./api/books.js";
import {
  handlerBorrowersCreate,
  handlerBorrowersDelete,
  handlerBorrowersList,
  handlerBorrowersUpdate,
} from "./api/borrowers.js";
import {
  handlerCheckoutBook,
  handlerReturnBook,
  handlerListBorrowedBooks,
  handlerListOverdueBooks,
} from "./api/borrowingService.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

// Parse JSON request bodies
app.use(express.json());
// Log all responses
app.use(middlewareLogResponse);
// Health check endpoint
app.get("/healthz", async (req, res) => {
  await handlerReadiness(req, res);
});

// Create a new book
app.post("/api/books", (req, res, next) => {
  Promise.resolve(handlerCreateBook(req, res)).catch(next);
});
// Get all books
app.get("/api/books", (req, res, next) => {
  Promise.resolve(handlerGetBooks(req, res)).catch(next);
});
// Search books
app.get("/api/books/search", (req, res, next) => {
  Promise.resolve(handlerSearchBooks(req, res)).catch(next);
});
// Update a book
app.patch("/api/books/:id", (req, res, next) => {
  Promise.resolve(handlerBooksUpdate(req, res)).catch(next);
});

// Delete a book
app.delete("/api/books/:id", (req, res, next) => {
  Promise.resolve(handlerDeleteBook(req, res)).catch(next);
});
// Get all borrowers
app.get("/api/borrowers", (req, res, next) => {
  Promise.resolve(handlerBorrowersList(req, res)).catch(next);
});
// Create a new borrower
app.post("/api/borrowers", (req, res, next) => {
  Promise.resolve(handlerBorrowersCreate(req, res)).catch(next);
});

// Update a borrower
app.patch("/api/borrowers/:id", (req, res, next) => {
  Promise.resolve(handlerBorrowersUpdate(req, res)).catch(next);
});

// Delete a borrower
app.delete("/api/borrowers/:id", (req, res, next) => {
  Promise.resolve(handlerBorrowersDelete(req, res)).catch(next);
});

// Checkout a book
app.post("/api/borrowings/checkout", (req, res, next) => {
  Promise.resolve(handlerCheckoutBook(req, res)).catch(next);
});

// Return a book
app.post("/api/borrowings/return", (req, res, next) => {
  Promise.resolve(handlerReturnBook(req, res)).catch(next);
});

// List borrowed books for a user
app.get("/api/borrowers/:id/borrowed-books", (req, res, next) => {
  Promise.resolve(handlerListBorrowedBooks(req, res)).catch(next);
});
// List overdue books
app.get("/api/borrowings/overdue", (req, res, next) => {
  Promise.resolve(handlerListOverdueBooks(req, res)).catch(next);
});
// Error handling middleware
app.use(errorMiddleWare);

app.listen(config.api.port, () => {
  console.log(`Server is running at http://localhost:${config.api.port}`);
});
