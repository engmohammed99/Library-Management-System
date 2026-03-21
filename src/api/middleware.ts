import type { Request, Response, NextFunction } from "express";
import { validate as isValidUUID } from "uuid";

import { respondWithError } from "./json.js";

import {
  BadRequestError,
  NotFoundError,
  UserForbiddenError,
  UserNotAuthenticatedError,
} from "./errors.js";

export function middlewareLogResponse(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => {
    const statusCode = res.statusCode;

    if (statusCode >= 300) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
    }
  });

  next();
}

export function errorMiddleWare(
  err: Error,
  _: Request,
  res: Response,
  __: NextFunction,
) {
  let statusCode = 500;
  let message =
    `[DEBUG] Name: ${err.name}, Message: ${err.message}` ||
    "Something went wrong on our end";

  if (err instanceof BadRequestError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof UserNotAuthenticatedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof UserForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  }

  if (statusCode >= 500) {
    console.log(err.message);
  }

  respondWithError(res, statusCode, message);
}

export function validateUUIDs(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      const value = req.body[field] || req.params[field];
      if (value && !isValidUUID(value)) {
        return next(new BadRequestError(`Invalid ${field} format.`));
      }
    }
    next();
  };
}
