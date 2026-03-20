import { asc, or, ilike, eq } from "drizzle-orm";
import { db } from "../index.js";
import { books, NewBook } from "../schema.js";

export async function createBook(book: NewBook) {
  const [result] = await db
    .insert(books)
    .values(book)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function getAllBooks() {
  return await db.select().from(books).orderBy(asc(books.createdAt));
}

export async function searchBooks(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;

  const rows = await db
    .select()
    .from(books)
    .where(
      or(
        ilike(books.title, searchPattern),
        ilike(books.author, searchPattern),
        ilike(books.isbn, searchPattern),
      ),
    );

  if (rows.length === 0) {
    return [];
  }

  return rows;
}

export async function updateBook(id: string, updateData: Partial<NewBook>) {
  const dataToUpdate = {
    ...updateData,
    updatedAt: new Date(),
  };

  const rows = await db
    .update(books)
    .set(dataToUpdate)
    .where(eq(books.id, id))
    .returning();

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

export async function deleteBook(id: string) {
  const rows = await db.delete(books).where(eq(books.id, id)).returning();

  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

export async function reset() {
  await db.delete(books);
}
