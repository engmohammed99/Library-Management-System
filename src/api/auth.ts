import { getBorrowerByEmail } from "../db/queries/borrowers.js";
import { checkPasswordHash } from "../auth.js";
import { respondWithJSON } from "./json.js";
import { UserNotAuthenticatedError } from "./errors.js";

import type { Request, Response } from "express";
import type { BorrowerResponse } from "./borrowers.js";

export async function handlerLogin(req: Request, res: Response) {
  type parameters = {
    password: string;
    email: string;
  };

  const params: parameters = req.body;

  const user = await getBorrowerByEmail(params.email);
  if (!user) {
    throw new UserNotAuthenticatedError("incorrect email or password");
  }

  const matching = await checkPasswordHash(
    params.password,
    user.hashedPassword,
  );
  if (!matching) {
    throw new UserNotAuthenticatedError("incorrect email or password");
  }

  respondWithJSON(res, 200, {
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      registeredDate: user.registeredDate,
    } satisfies BorrowerResponse,
  });
}
