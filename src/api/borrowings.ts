import { Request, Response, NextFunction } from "express";
import {
  checkoutBook,
  getActiveBorrowsForUser,
  getOverdueBooks,
  returnBook,
  BorrowingErrors,
} from "../db/queries/borrowings.js";
import { BadRequestError, NotFoundError } from "./errors.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { config } from "../config.js";
export async function handlerCheckoutBook(req: Request, res: Response) {
  const { bookId } = req.body;
  const token = getBearerToken(req);
  const borrowerId = validateJWT(token, config.jwt.secret);
  if (!bookId || !borrowerId) {
    throw new BadRequestError("Missing bookId or borrowerId.");
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === BorrowingErrors.BOOK_NOT_FOUND) {
        throw new NotFoundError("The requested book does not exist.");
      } else if (error.message === BorrowingErrors.BORROWER_NOT_FOUND) {
        throw new NotFoundError("The requested borrower does not exist.");
      } else if (error.message === BorrowingErrors.BOOK_OUT_OF_STOCK) {
        throw new BadRequestError("This book is currently out of stock.");
      }
    }
    // Re-throw unknown errors so standard express error handling catches them
    throw error;
  }
}

// Handler for returning a book
export async function handlerReturnBook(req: Request, res: Response) {
  const { bookId, borrowerId } = req.body;

  if (!bookId || !borrowerId) {
    throw new BadRequestError("Missing bookId or borrowerId.");
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === BorrowingErrors.BORROWER_NOT_FOUND) {
        throw new NotFoundError("The requested borrower does not exist.");
      } else if (error.message === BorrowingErrors.NO_ACTIVE_BORROWING) {
        throw new BadRequestError(
          "This borrower does not currently have this book checked out.",
        );
      }
    }
    throw error;
  }
}

export async function handlerListBorrowedBooks(req: Request, res: Response) {
  const borrowerId = req.params.id as string;

  if (!borrowerId) {
    throw new BadRequestError("Missing borrower ID.");
  }

  try {
    // Fetch the joined data
    const borrowedBooks = await getActiveBorrowsForUser(borrowerId);

    // Return the payload
    res.status(200).json({
      success: true,
      count: borrowedBooks.length,
      data: borrowedBooks,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === BorrowingErrors.BORROWER_NOT_FOUND
    ) {
      throw new NotFoundError("The requested borrower does not exist.");
    }
    throw error;
  }
}

export async function handlerListOverdueBooks(req: Request, res: Response) {
  const overdueBooks = await getOverdueBooks();

  res.status(200).json({
    success: true,
    count: overdueBooks.length,
    data: overdueBooks,
  });
}
