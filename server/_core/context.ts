import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { tryDevAuth } from "./devAuth";
import { googleAuth } from "./googleAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const devUser = await tryDevAuth(opts.req);
  if (devUser) {
    return {
      req: opts.req,
      res: opts.res,
      user: devUser,
    };
  }

  let user: User | null = null;

  try {
    user = await googleAuth.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
