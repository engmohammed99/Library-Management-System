import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import e from "express";

// ==========================================
// 1. BOOKS TABLE
// ==========================================
export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    author: varchar("author", { length: 255 }).notNull(),
    isbn: varchar("isbn", { length: 20 }).notNull().unique(),
    availableQuantity: integer("available_quantity").notNull(),
    shelfLocation: varchar("shelf_location", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      titleIdx: index("idx_books_title").on(table.title),
      authorIdx: index("idx_books_author").on(table.author),
      // Database-level check to ensure quantity never drops below 0
      quantityCheck: check(
        "quantity_check",
        sql`${table.availableQuantity} >= 0`,
      ),
    };
  },
);

export type NewBook = typeof books.$inferInsert;
export type Book = typeof books.$inferSelect;
// ==========================================
// 2. BORROWERS TABLE
// ==========================================
export const borrowers = pgTable(
  "borrowers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    registeredDate: timestamp("registered_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    hashedPassword: varchar("hashed_password", { length: 256 })
      .notNull()
      .default("unset"),
  },
  (table) => {
    return {
      nameIdx: index("idx_borrowers_name").on(table.name),
    };
  },
);

export type NewBorrower = typeof borrowers.$inferInsert;
export type Borrower = typeof borrowers.$inferSelect;

// ==========================================
// 3. BORROWING RECORDS TABLE
// ==========================================
export const borrowingRecords = pgTable(
  "borrowing_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    borrowerId: uuid("borrower_id")
      .notNull()
      .references(() => borrowers.id, { onDelete: "restrict" }),
    checkoutDate: timestamp("checkout_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    returnDate: timestamp("return_date", { withTimezone: true }), // Nullable because it might not be returned yet
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      bookIdIdx: index("idx_borrowing_book_id").on(table.bookId),
      borrowerIdIdx: index("idx_borrowing_borrower_id").on(table.borrowerId),
      // Composite index for quickly finding overdue books
      statusIdx: index("idx_borrowing_status").on(
        table.returnDate,
        table.dueDate,
      ),
    };
  },
);

// ==========================================
// DRIZZLE RELATIONS (For easier querying)
// ==========================================

export const booksRelations = relations(books, ({ many }) => ({
  borrowingRecords: many(borrowingRecords),
}));

export const borrowersRelations = relations(borrowers, ({ many }) => ({
  borrowingRecords: many(borrowingRecords),
}));

export const borrowingRecordsRelations = relations(
  borrowingRecords,
  ({ one }) => ({
    book: one(books, {
      fields: [borrowingRecords.bookId],
      references: [books.id],
    }),
    borrower: one(borrowers, {
      fields: [borrowingRecords.borrowerId],
      references: [borrowers.id],
    }),
  }),
);
