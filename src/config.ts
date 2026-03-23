import type { MigrationConfig } from "drizzle-orm/migrator";

type Config = {
  api: APIConfig;
  db: DBConfig;
  jwt: JWTConfig;
};

type APIConfig = {
  port: number;
};

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};
type JWTConfig = {
  defaultDuration: number;
  secret: string;
  issuer: string;
};
process.loadEnvFile();

function envOrThrow(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};

export const config: Config = {
  api: {
    port: Number(envOrThrow("PORT")),
  },
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: migrationConfig,
  },
  jwt: {
    defaultDuration: 60 * 60, // 1 hour in seconds
    secret: envOrThrow("JWT_SECRET"),
    issuer: "chirpy",
  },
};
