import { eq, and, isNull, lt, gte, lte } from "drizzle-orm";
import { db } from "../index.js";
import { books, borrowers, borrowingRecords } from "../schema.js";

export const BorrowingErrors = {
  BOOK_NOT_FOUND: "BOOK_NOT_FOUND",
  BOOK_OUT_OF_STOCK: "BOOK_OUT_OF_STOCK",
  BORROWER_NOT_FOUND: "BORROWER_NOT_FOUND",
  NO_ACTIVE_BORROWING: "NO_ACTIVE_BORROWING",
};

export async function checkoutBook(bookId: string, borrowerId: string) {
  // Start the database transaction
  return await db.transaction(async (tx) => {
    // Check if the book exists and has available inventory
    const bookList = await tx.select().from(books).where(eq(books.id, bookId));
    if (bookList.length === 0) {
      throw new Error(BorrowingErrors.BOOK_NOT_FOUND);
    }

    const book = bookList[0];
    if (book.availableQuantity <= 0) {
      throw new Error(BorrowingErrors.BOOK_OUT_OF_STOCK);
    }

    // Check if the borrower exists
    const borrowerList = await tx
      .select()
      .from(borrowers)
      .where(eq(borrowers.id, borrowerId));
    if (borrowerList.length === 0) {
      throw new Error(BorrowingErrors.BORROWER_NOT_FOUND);
    }

    // Decrease the book's available quantity by 1
    await tx
      .update(books)
      .set({ availableQuantity: book.availableQuantity - 1 })
      .where(eq(books.id, bookId));

    // Calculate the Due Date (e.g., 14 days from today)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create the borrowing record
    const [newRecord] = await tx
      .insert(borrowingRecords)
      .values({
        bookId,
        borrowerId,
        checkoutDate: new Date(),
        dueDate: dueDate,
      })
      .returning();

    return newRecord;
  });
}

export async function returnBook(bookId: string, borrowerId: string) {
  return await db.transaction(async (tx) => {
    // Check if the borrower exists first
    const borrowerList = await tx
      .select()
      .from(borrowers)
      .where(eq(borrowers.id, borrowerId));
    if (borrowerList.length === 0) {
      throw new Error(BorrowingErrors.BORROWER_NOT_FOUND);
    }

    // Find the active borrowing record
    const activeRecords = await tx
      .select()
      .from(borrowingRecords)
      .where(
        and(
          eq(borrowingRecords.bookId, bookId),
          eq(borrowingRecords.borrowerId, borrowerId),
          isNull(borrowingRecords.returnDate),
        ),
      );

    if (activeRecords.length === 0) {
      throw new Error(BorrowingErrors.NO_ACTIVE_BORROWING);
    }

    const activeRecord = activeRecords[0];

    // Mark the book as returned by stamping the current date
    const [updatedRecord] = await tx
      .update(borrowingRecords)
      .set({ returnDate: new Date() })
      .where(eq(borrowingRecords.id, activeRecord.id))
      .returning();

    // Find the book to get its current quantity
    const bookList = await tx.select().from(books).where(eq(books.id, bookId));
    const book = bookList[0];

    // Increase the available quantity by 1
    await tx
      .update(books)
      .set({ availableQuantity: book.availableQuantity + 1 })
      .where(eq(books.id, bookId));

    return updatedRecord;
  });
}

export async function getActiveBorrowsForUser(borrowerId: string) {
  // 1. Check if the borrower exists first
  const borrowerList = await db
    .select()
    .from(borrowers)
    .where(eq(borrowers.id, borrowerId));

  if (borrowerList.length === 0) {
    throw new Error(BorrowingErrors.BORROWER_NOT_FOUND);
  }

  // 2. Fetch the active borrows
  return await db
    .select({
      borrowingId: borrowingRecords.id,
      borrowDate: borrowingRecords.checkoutDate,
      dueDate: borrowingRecords.dueDate,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        isbn: books.isbn,
      },
    })
    .from(borrowingRecords)
    .innerJoin(books, eq(borrowingRecords.bookId, books.id))
    .where(
      and(
        eq(borrowingRecords.borrowerId, borrowerId),
        isNull(borrowingRecords.returnDate),
      ),
    );
}

export async function getOverdueBooks() {
  const now = new Date();

  return await db
    .select({
      borrowingId: borrowingRecords.id,
      borrowDate: borrowingRecords.checkoutDate,
      dueDate: borrowingRecords.dueDate,
      book: {
        id: books.id,
        title: books.title,
      },
      borrower: {
        id: borrowers.id,
        name: borrowers.name,
        email: borrowers.email,
      },
    })
    .from(borrowingRecords)
    .innerJoin(books, eq(borrowingRecords.bookId, books.id))
    .innerJoin(borrowers, eq(borrowingRecords.borrowerId, borrowers.id))
    .where(
      and(
        isNull(borrowingRecords.returnDate),
        lt(borrowingRecords.dueDate, now),
      ),
    );
}

export async function getBorrowingAnalytics(
  startDateStr: string,
  endDateStr: string,
) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Ensure we include the entire end day
  endDate.setHours(23, 59, 59, 999);

  return await db
    .select({
      borrowingId: borrowingRecords.id,
      bookTitle: books.title,
      bookIsbn: books.isbn,
      borrowerName: borrowers.name,
      borrowerEmail: borrowers.email,
      checkoutDate: borrowingRecords.checkoutDate,
      dueDate: borrowingRecords.dueDate,
      returnDate: borrowingRecords.returnDate,
    })
    .from(borrowingRecords)
    .innerJoin(books, eq(borrowingRecords.bookId, books.id))
    .innerJoin(borrowers, eq(borrowingRecords.borrowerId, borrowers.id))
    .where(
      and(
        gte(borrowingRecords.checkoutDate, startDate),
        lte(borrowingRecords.checkoutDate, endDate),
      ),
    );
}
