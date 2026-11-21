import { z } from "zod";
const ConfigSchema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(4310),
  DATABASE_URL: z.string().default("./data/codex-office.db"),
  CODEX_BIN: z.string().default("codex"),
  OFFICE_AUTH_TOKEN: z.string().min(16),
  WEB_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  SERVE_WEB: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});
export type AppConfig = z.infer<typeof ConfigSchema>;
export function readConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  return ConfigSchema.parse(environment);
}
