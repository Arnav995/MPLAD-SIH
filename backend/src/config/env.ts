import "dotenv/config";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing in env vars`);
  }

  return value;
}

export const env = {
  ESAKSHI_BASE_URL: requiredEnv("ESAKSHI_BASE_URL"),

  ESAKSHI_TIMEOUT_MS: Number(
    process.env.ESAKSHI_TIMEOUT_MS ?? 30000,
  ),

  PORT: Number(
    process.env.PORT ?? 4000,
  ),

  DATABASE_URL: requiredEnv("DATABASE_URL"),
};