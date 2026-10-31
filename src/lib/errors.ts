// OWNER: Builder A. Server-side error type for the summon pipeline.
import type { ErrorCode } from "@/lib/contract";

/** Throw this from server code; the API route turns it into a SummonFailure. */
export class SummonError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SummonError";
  }
}
