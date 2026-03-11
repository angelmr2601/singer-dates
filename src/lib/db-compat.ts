import { prisma } from "@/lib/db";

let hasMustChangePasswordColumnPromise: Promise<boolean> | null = null;

export async function hasMustChangePasswordColumn() {
  if (!hasMustChangePasswordColumnPromise) {
    hasMustChangePasswordColumnPromise = prisma
      .$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'User'
            AND column_name = 'mustChangePassword'
        ) AS "exists"
      `
      .then((rows) => rows[0]?.exists ?? false)
      .catch(() => false);
  }

  return hasMustChangePasswordColumnPromise;
}
