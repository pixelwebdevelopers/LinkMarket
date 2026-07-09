/**
 * Strips HTML tags and removes malicious script patterns to prevent XSS,
 * and strips common SQL comment indicators to neutralize injection attempts.
 */
export function sanitizeString(val: string): string {
  if (!val || typeof val !== "string") return val;

  let cleaned = val;

  // 1. Remove dangerous script/style tags and javascript: URLs
  cleaned = cleaned.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "");
  cleaned = cleaned.replace(/javascript:/gi, "");
  cleaned = cleaned.replace(/onload=/gi, "");
  cleaned = cleaned.replace(/onerror=/gi, "");
  cleaned = cleaned.replace(/onclick=/gi, "");

  // 2. Strip standard HTML tags entirely to keep inputs plain-text.
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // 3. Prevent SQL injection indicators (comments and raw commands that could bypass checks).
  // Parameterized queries prevent actual execution, but sanitizing comment markers from
  // inputs keeps the database clean and guards against downstream string interpolations.
  cleaned = cleaned.replace(/--+/g, "");
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");

  return cleaned.trim();
}

/**
 * Recursively sanitizes strings inside an object, array, or primitive.
 */
export function sanitizeInput<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return sanitizeString(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const sanitizedObj = {} as Record<string, unknown>;
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitizedObj[key] = sanitizeInput((input as Record<string, unknown>)[key]);
      }
    }
    return sanitizedObj as T;
  }

  return input;
}
