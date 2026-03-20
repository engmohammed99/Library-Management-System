import type { Request, Response } from "express";
import { validate as isValidUUID } from "uuid";
import {
  createBook,
  getAllBooks,
  searchBooks,
  updateBook,
  deleteBook,
} from "../db/queries/books.js";
import { BadRequestError, NotFoundError } from "./errors.js";
import { respondWithJSON } from "./json.js";

// Create a new book handler
export async function handlerCreateBook(req: Request, res: Response) {
  type parameters = {
    title: string;
    author: string;
    isbn: string;
    availableQuantity: number;
    shelfLocation: string;
  };

  const params: parameters = req.body;

  // Validate required fields
  if (
    !params.title ||
    !params.author ||
    !params.isbn ||
    params.availableQuantity === undefined ||
    !params.shelfLocation
  ) {
    throw new BadRequestError("Missing required fields");
  }

  const book = await createBook({
    title: params.title,
    author: params.author,
    isbn: params.isbn,
    availableQuantity: params.availableQuantity,
    shelfLocation: params.shelfLocation,
  });

  if (!book) {
    throw new Error("Could not create book");
  }

  // Return the newly created resource
  respondWithJSON(res, 201, {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    availableQuantity: book.availableQuantity,
    shelfLocation: book.shelfLocation,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  });
}

// Get all books handler
export async function handlerGetBooks(_: Request, res: Response) {
  const books = await getAllBooks();

  respondWithJSON(res, 200, { books });
}

// Search books handler
export async function handlerSearchBooks(req: Request, res: Response) {
  const searchQueryRaw = req.query.q;
  const searchQuery = Array.isArray(searchQueryRaw)
    ? searchQueryRaw[0]
    : searchQueryRaw;

  if (!searchQuery || typeof searchQuery !== "string") {
    throw new BadRequestError(
      "Please provide a search term using the 'q' query parameter",
    );
  }

  const matchingBooks = await searchBooks(searchQuery);

  res.status(200).json({
    success: true,
    count: matchingBooks.length,
    data: matchingBooks,
  });
}

// Update book handler
export async function handlerBooksUpdate(req: Request, res: Response) {
  const rawId = req.params.id;
  // Handle the case where id is an array
  const bookId = Array.isArray(rawId) ? rawId[0] : rawId;

  // Validate that the book ID is a valid UUID
  if (!isValidUUID(bookId)) {
    throw new BadRequestError("Invalid book ID format");
  }
  // Validate that the book ID is provided
  if (!bookId) throw new BadRequestError("Book ID is required");
  const updateData = req.body;

  // Prevent empty updates
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new BadRequestError("Please provide at least one field to update.");
  }

  // Perform the update
  const updatedBook = await updateBook(bookId, updateData);

  // Handle the case where the book doesn't exist
  if (!updatedBook) {
    throw new NotFoundError("Book not found");
  }

  respondWithJSON(res, 200, updatedBook);
}

// Delete book handler
export async function handlerDeleteBook(req: Request, res: Response) {
  const rawId = req.params.id;
  // Handle the case where id is an array
  const bookId = Array.isArray(rawId) ? rawId[0] : rawId;

  // Validate that the book ID is a valid UUID
  if (!isValidUUID(bookId)) {
    throw new BadRequestError("Invalid book ID format");
  }
  // Validate that the book ID is provided
  if (!bookId) throw new BadRequestError("Book ID is required");

  const deletedBook = await deleteBook(bookId);

  if (!deletedBook) {
    throw new NotFoundError("Book not found");
  }

  respondWithJSON(res, 200, deletedBook);
}
