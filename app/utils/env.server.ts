import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["production", "development", "test"] as const),
    HONEYPOT_SECRET: z.string().default("Sup3rS3cr3tH0n3yP0T"),
    SESSION_SECRET: z.string().default('Sup3rS3cr3tC00ki3'),
    ALLOW_INDEXING: z.enum(['true', 'false']).optional(),
    USE_SECURE_COOKIES: z
      .string()
      // only allow "true" or "false"
      .refine((s) => s === "true" || s === "false")
      // transform to boolean
      .transform((s) => s === "true"),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  // clientPrefix: "PUBLIC_",

  // client: {},

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,

  onValidationError: (error) => {
    console.error(
      "❌ Invalid environment variables:",
      error
    );
    throw new Error("Invalid environment variables");
  },
});

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
  return {
    ALLOW_INDEXING: process.env.ALLOW_INDEXING,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
}
