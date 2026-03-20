import { Request, Response, NextFunction } from "express";
import { validate as isValidUUID } from "uuid";
import {
  checkoutBook,
  getActiveBorrowsForUser,
  getOverdueBooks,
  returnBook,
} from "../db/queries/borrowingService.js";
import { BadRequestError, NotFoundError } from "./errors.js";

export async function handlerCheckoutBook(req: Request, res: Response) {
  const { bookId, borrowerId } = req.body;

  // Validate both IDs
  if (!isValidUUID(bookId) || !isValidUUID(borrowerId)) {
    res
      .status(400)
      .json({ success: false, error: "Invalid bookId or borrowerId format." });
    return;
  }

  try {
    // Execute the checkout transaction
    const record = await checkoutBook(bookId, borrowerId);

    // Return the successful record
    res.status(201).json({
      success: true,
      message: "Book successfully checked out.",
      data: record,
    });
  } catch (error: any) {
    // Handle errors using error handlers
    if (error.message === "BOOK_NOT_FOUND") {
      throw new NotFoundError("The requested book does not exist.");
    } else if (error.message === "BORROWER_NOT_FOUND") {
      throw new NotFoundError("The requested borrower does not exist.");
    } else if (error.message === "BOOK_OUT_OF_STOCK") {
      throw new BadRequestError("This book is currently out of stock.");
    }
  }
}

// Handler for returning a book
export async function handlerReturnBook(req: Request, res: Response) {
  const { bookId, borrowerId } = req.body;

  // Validate both IDs
  if (!isValidUUID(bookId) || !isValidUUID(borrowerId)) {
    res
      .status(400)
      .json({ success: false, error: "Invalid bookId or borrowerId format." });
    return;
  }

  try {
    // Execute the return transaction
    const record = await returnBook(bookId, borrowerId);

    // Return the successful record
    res.status(200).json({
      success: true,
      message: "Book successfully returned.",
      data: record,
    });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_BORROWING") {
      throw new BadRequestError(
        "This borrower does not currently have this book checked out.",
      );
    }
  }
}

export async function handlerListBorrowedBooks(req: Request, res: Response) {
  const RawborrowerId = req.params.id;
  const borrowerId = Array.isArray(RawborrowerId)
    ? RawborrowerId[0]
    : RawborrowerId;

  // Validate the UUID
  if (!isValidUUID(borrowerId)) {
    res
      .status(400)
      .json({ success: false, error: "Invalid borrower ID format." });
    return;
  }

  // Fetch the joined data
  const borrowedBooks = await getActiveBorrowsForUser(borrowerId);

  // Return the payload
  res.status(200).json({
    success: true,
    count: borrowedBooks.length,
    data: borrowedBooks,
  });
}

export async function handlerListOverdueBooks(req: Request, res: Response) {
  const overdueBooks = await getOverdueBooks();

  res.status(200).json({
    success: true,
    count: overdueBooks.length,
    data: overdueBooks,
  });
}
