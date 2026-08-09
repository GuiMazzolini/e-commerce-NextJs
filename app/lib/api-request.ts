import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * Parse and validate a JSON request body against a schema.
 *
 * Returns a discriminated union so callers can `if (!parsed.ok) return
 * parsed.response;` and get a uniform 400 for both malformed JSON and schema
 * violations, without leaking internal field paths to the client.
 */
export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<
  { ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: badRequest("Invalid request body") };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: badRequest(firstIssueMessage(result.error)) };
  }

  return { ok: true, data: result.data };
}

function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request body";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
