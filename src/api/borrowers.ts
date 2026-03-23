import { Request, Response } from "express";
import {
  deleteBorrower,
  getAllBorrowers,
  getBorrowerById,
  updateBorrower,
} from "../db/queries/borrowers.js";
import { BadRequestError, NotFoundError } from "./errors.js";
import { createBorrower } from "../db/queries/borrowers.js";
import { validate as isValidUUID } from "uuid";
import isEmail from "validator/lib/isEmail.js";
import { NewBorrower } from "src/db/schema.js";
import { checkPasswordHash, hashPassword } from "../auth.js";
import { respondWithJSON } from "./json.js";

export type BorrowerResponse = Omit<NewBorrower, "hashedPassword">;

// Handler to create a new borrower
export async function handlerBorrowersCreate(req: Request, res: Response) {
  type parameters = {
    name: string;
    email: string;
    password: string;
  };
  const params: parameters = req.body;

  // Validate required fields
  if (!params.name || !params.email || !params.password) {
    throw new BadRequestError(
      "Missing required fields: name, email, and password",
    );
  }

  if (typeof params.name !== "string" || typeof params.email !== "string") {
    throw new BadRequestError(
      "Invalid request body: name and email must be strings",
    );
  }

  // Validate email format
  if (!isEmail(params.email)) {
    throw new BadRequestError("Invalid email format");
  }

  // Hash the password
  const hashedPassword = await hashPassword(params.password);

  // Create the borrower
  const borrower = await createBorrower({
    name: params.name,
    email: params.email,
    hashedPassword,
  } satisfies NewBorrower);

  if (!borrower) {
    throw new BadRequestError("A borrower with this email already exists.");
  }

  // Return success response
  respondWithJSON(res, 201, {
    success: true,
    data: {
      id: borrower.id,
      name: borrower.name,
      email: borrower.email,
      registeredDate: borrower.registeredDate,
    } satisfies BorrowerResponse,
  });
}

// Handler to list all borrowers
export async function handlerBorrowersList(req: Request, res: Response) {
  const allBorrowers = await getAllBorrowers();

  res.status(200).json({
    success: true,
    count: allBorrowers.length,
    data: allBorrowers,
  });
}

// Handler to get a single borrower by ID
export async function handlerBorrowersGet(req: Request, res: Response) {
  const borrowerId = req.params.id as string;

  if (!isValidUUID(borrowerId)) {
    throw new BadRequestError("Invalid borrower ID format");
  }

  const borrower = await getBorrowerById(borrowerId);

  if (!borrower) {
    throw new NotFoundError("Borrower not found");
  }

  res.status(200).json({
    success: true,
    data: borrower,
  });
}

export async function handlerBorrowersUpdate(req: Request, res: Response) {
  const RawborrowerId = req.params.id;
  const borrowerId = Array.isArray(RawborrowerId)
    ? RawborrowerId[0]
    : RawborrowerId;

  // Validate UUID
  if (!isValidUUID(borrowerId)) {
    throw new BadRequestError("Invalid borrower ID format");
  }

  const updateData = req.body;

  // Prevent empty updates
  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError("Please provide at least one field to update.");
  }

  // Validate email if it's being updated
  if (updateData.email && !isEmail(updateData.email)) {
    throw new BadRequestError("Invalid email format.");
    return;
  }

  // Perform the update
  const updatedBorrower = await updateBorrower(borrowerId, updateData);

  if (!updatedBorrower) {
    throw new NotFoundError("Borrower not found");
  }

  res.status(200).json({
    success: true,
    data: updatedBorrower,
  });
}

// Handler to delete a borrower
export async function handlerBorrowersDelete(req: Request, res: Response) {
  const RawborrowerId = req.params.id;
  const borrowerId = Array.isArray(RawborrowerId)
    ? RawborrowerId[0]
    : RawborrowerId;

  // Validate the UUID format
  if (!isValidUUID(borrowerId)) {
    throw new BadRequestError("Invalid borrower ID format.");
  }

  // Perform the deletion
  const deletedBorrower = await deleteBorrower(borrowerId);

  if (!deletedBorrower) {
    throw new NotFoundError("Borrower not found.");
  }

  res.status(200).json({
    success: true,
    message: "Borrower successfully deleted.",
    data: deletedBorrower,
  });
}
