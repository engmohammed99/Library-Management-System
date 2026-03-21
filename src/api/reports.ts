import { Request, Response } from "express";
import { getBorrowingAnalytics } from "../db/queries/borrowings.js";
import { BadRequestError } from "./errors.js";

function parseDateParams(req: Request) {
  const { startDate, endDate } = req.query;

  if (
    !startDate ||
    !endDate ||
    typeof startDate !== "string" ||
    typeof endDate !== "string"
  ) {
    throw new BadRequestError(
      "Both startDate and endDate query parameters are required (format YYYY-MM-DD).",
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new BadRequestError("Invalid date format. Please use YYYY-MM-DD.");
  }

  return { start: startDate, end: endDate };
}

export async function handlerBorrowingAnalytics(req: Request, res: Response) {
  const { start, end } = parseDateParams(req);
  const records = await getBorrowingAnalytics(start, end);

  res.status(200).json({
    success: true,
    count: records.length,
    data: records,
  });
}

function getLastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function generateCSVContent(records: any[]) {
  const headers = [
    "Borrowing ID",
    "Book Title",
    "ISBN",
    "Borrower Name",
    "Email",
    "Checkout Date",
    "Due Date",
    "Return Date",
    "Status",
  ];

  const rows = records.map((r: any) => {
    let status = "Active";
    if (r.returnDate) {
      status = "Returned";
    } else if (new Date() > new Date(r.dueDate)) {
      status = "Overdue";
    }

    return [
      r.borrowingId,
      `"${r.bookTitle.replace(/"/g, '""')}"`,
      r.bookIsbn,
      `"${r.borrowerName.replace(/"/g, '""')}"`,
      r.borrowerEmail,
      new Date(r.checkoutDate).toISOString().split("T")[0],
      new Date(r.dueDate).toISOString().split("T")[0],
      r.returnDate
        ? new Date(r.returnDate).toISOString().split("T")[0]
        : "Not Returned",
      status,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export async function handlerExportBorrowingsCSV(req: Request, res: Response) {
  const { start, end } = parseDateParams(req);
  const records = await getBorrowingAnalytics(start, end);

  const csvContent = generateCSVContent(records);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="library_export_${start}_to_${end}.csv"`,
  );
  res.status(200).send(csvContent);
}

export async function handlerExportLastMonth(req: Request, res: Response) {
  const { start, end } = getLastMonthRange();
  const records = await getBorrowingAnalytics(start, end);

  const csvContent = generateCSVContent(records);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="borrowings_last_month_${start}_to_${end}.csv"`,
  );
  res.status(200).send(csvContent);
}

export async function handlerExportOverdueLastMonth(
  req: Request,
  res: Response,
) {
  const { start, end } = getLastMonthRange();
  const records = await getBorrowingAnalytics(start, end);

  // Filter ONLY overdue records from last month
  const overdueRecords = records.filter(
    (r) => !r.returnDate && new Date() > new Date(r.dueDate),
  );

  const csvContent = generateCSVContent(overdueRecords);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="overdue_last_month_${start}_to_${end}.csv"`,
  );
  res.status(200).send(csvContent);
}
