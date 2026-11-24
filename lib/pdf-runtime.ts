type PdfEnvironment = {
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?: string;
  VERCEL?: string;
};

export function resolvePdfRuntime(env: PdfEnvironment) {
  const executablePath = env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  if (executablePath) return { mode: "custom" as const, executablePath };
  if (env.VERCEL === "1") return { mode: "vercel" as const };
  return { mode: "local" as const };
}
