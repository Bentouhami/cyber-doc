import { createServer } from "node:http";

import { generatePdfBufferFromHtml } from "../../services/documentRenderService";

const SAMPLE_COUNT = 3;
const MAX_CHECK_DURATION_MS = 15_000;

async function listenOnLoopback() {
  let requestCount = 0;
  const server = createServer((_request, response) => {
    requestCount += 1;
    response.writeHead(200, { "Content-Type": "image/svg+xml" });
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Unable to create the PDF render isolation probe");
  }

  return {
    url: `http://127.0.0.1:${address.port}/external.svg`,
    requests: () => requestCount,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

async function main() {
  const probe = await listenOnLoopback();
  const durations: number[] = [];

  try {
    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const startedAt = performance.now();
      const pdf = await generatePdfBufferFromHtml(`
        <main>
          <h1>CyberDoc PDF ${index + 1}</h1>
          <img alt="embedded" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'/%3E" />
          <img alt="blocked external resource" src="${probe.url}" />
          <script>document.body.dataset.executed = "true";</script>
        </main>
      `);
      const durationMs = Math.round(performance.now() - startedAt);

      if (!pdf.subarray(0, 4).equals(Buffer.from("%PDF"))) {
        throw new Error("Renderer did not return a PDF buffer");
      }
      if (durationMs > MAX_CHECK_DURATION_MS) {
        throw new Error(`PDF render exceeded ${MAX_CHECK_DURATION_MS}ms`);
      }

      durations.push(durationMs);
    }

    if (probe.requests() !== 0) {
      throw new Error("PDF renderer made a forbidden network request");
    }

    const sorted = [...durations].sort((left, right) => left - right);
    console.log(JSON.stringify({
      samplesMs: durations,
      medianMs: sorted[Math.floor(sorted.length / 2)],
      blockedNetworkRequests: probe.requests(),
    }));
  } finally {
    await probe.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "PDF render check failed");
  process.exitCode = 1;
});
