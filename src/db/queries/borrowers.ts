import { db } from "../index.js";
import { borrowers, NewBorrower } from "../schema.js";
import { eq } from "drizzle-orm";

// Create a new borrower
export async function createBorrower(borrowerData: NewBorrower) {
  const [newBorrower] = await db
    .insert(borrowers)
    .values(borrowerData)
    .onConflictDoNothing()
    .returning();

  return newBorrower;
}
export async function getAllBorrowers() {
  return await db.select().from(borrowers);
}

// Get a single borrower by ID
export async function getBorrowerById(id: string) {
  const rows = await db.select().from(borrowers).where(eq(borrowers.id, id));
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

// Update a borrower by ID
export async function updateBorrower(
  id: string,
  updateData: Partial<NewBorrower>,
) {
  const dataToUpdate = {
    ...updateData,
    updatedAt: new Date(),
  };

  const rows = await db
    .update(borrowers)
    .set(dataToUpdate)
    .where(eq(borrowers.id, id))
    .returning();

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

// Delete a borrower by ID
export async function deleteBorrower(id: string) {
  const rows = await db
    .delete(borrowers)
    .where(eq(borrowers.id, id))
    .returning();

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}
