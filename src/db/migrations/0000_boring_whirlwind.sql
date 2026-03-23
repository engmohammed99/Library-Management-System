-- Check if the column 'hashed_password' exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'borrowers' AND column_name = 'hashed_password'
    ) THEN
        ALTER TABLE borrowers ADD COLUMN hashed_password varchar(256) DEFAULT 'unset' NOT NULL;
    END IF;
END $$;

CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"isbn" varchar(20) NOT NULL,
	"available_quantity" integer NOT NULL,
	"shelf_location" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn"),
	CONSTRAINT "quantity_check" CHECK ("books"."available_quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "borrowers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"registered_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "borrowers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "borrowing_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"borrower_id" uuid NOT NULL,
	"checkout_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"return_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "borrowing_records" ADD CONSTRAINT "borrowing_records_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowing_records" ADD CONSTRAINT "borrowing_records_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_books_title" ON "books" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_books_author" ON "books" USING btree ("author");--> statement-breakpoint
CREATE INDEX "idx_borrowers_name" ON "borrowers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_borrowing_book_id" ON "borrowing_records" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_borrowing_borrower_id" ON "borrowing_records" USING btree ("borrower_id");--> statement-breakpoint
CREATE INDEX "idx_borrowing_status" ON "borrowing_records" USING btree ("return_date","due_date");