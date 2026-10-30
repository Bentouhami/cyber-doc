import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  normalizeStoredRelativePath,
  resolveOwnedStoredFile,
  resolveSecureWritePath,
  safeDownloadFileName,
  StoredFileAccessError,
} from "../../services/storageSecurity";
import { writeDocumentFileAtomically } from "../../services/documentStorageService";

async function withStorageFixture(
  run: (fixture: { root: string; outside: string }) => Promise<void>,
) {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cyberdoc-storage-test-"));
  const root = path.join(fixtureRoot, "storage");
  const outside = path.join(fixtureRoot, "outside");
  await Promise.all([
    fs.mkdir(path.join(root, "documents"), { recursive: true }),
    fs.mkdir(outside, { recursive: true }),
  ]);
  try {
    await run({ root, outside });
  } finally {
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  }
}

describe("stored file security", () => {
  it("resolves an owned regular file below the real storage root", async () => {
    await withStorageFixture(async ({ root }) => {
      const expected = path.join(root, "documents", "owned.pdf");
      await fs.writeFile(expected, "pdf");

      const resolved = await resolveOwnedStoredFile({
        root,
        storedPath: "storage/documents/owned.pdf",
        legacyPrefixes: ["storage"],
      });

      assert.equal(resolved, await fs.realpath(expected));
    });
  });

  it("rejects traversal before touching the filesystem", () => {
    assert.throws(
      () => normalizeStoredRelativePath("documents/../outside/secret.pdf"),
      (error) => error instanceof StoredFileAccessError && error.code === "INVALID_PATH",
    );
  });

  it("rejects a symlinked read path that escapes the owned root", async () => {
    await withStorageFixture(async ({ root, outside }) => {
      await fs.writeFile(path.join(outside, "secret.pdf"), "secret");
      await fs.symlink(
        outside,
        path.join(root, "documents", "linked"),
        process.platform === "win32" ? "junction" : "dir",
      );

      await assert.rejects(
        resolveOwnedStoredFile({
          root,
          storedPath: "documents/linked/secret.pdf",
        }),
        (error) =>
          error instanceof StoredFileAccessError &&
          (error.code === "OUTSIDE_ROOT" || error.code === "SYMLINK"),
      );
    });
  });

  it("rejects writes through a symlinked parent directory", async () => {
    await withStorageFixture(async ({ root, outside }) => {
      await fs.rm(path.join(root, "documents"), { recursive: true });
      await fs.symlink(
        outside,
        path.join(root, "documents"),
        process.platform === "win32" ? "junction" : "dir",
      );

      await assert.rejects(
        resolveSecureWritePath(root, "documents/generated.pdf"),
        (error) =>
          error instanceof StoredFileAccessError &&
          (error.code === "OUTSIDE_ROOT" || error.code === "SYMLINK"),
      );
    });
  });

  it("sanitizes response filenames against header injection", () => {
    assert.equal(
      safeDownloadFileName('..\\folder\\report\r\nX-Test: injected".pdf', "document.pdf"),
      "report__X-Test: injected_.pdf",
    );
  });

  it("publishes complete files atomically and removes staging files on failure", async () => {
    await withStorageFixture(async ({ root }) => {
      const previousRoot = process.env.DOCS_STORAGE_DIR;
      process.env.DOCS_STORAGE_DIR = root;
      try {
        const written = await writeDocumentFileAtomically(
          "documents/atomic.pdf",
          Buffer.from("complete pdf"),
        );
        assert.equal(await fs.readFile(written, "utf8"), "complete pdf");

        await fs.mkdir(path.join(root, "documents", "blocked.pdf"));
        await assert.rejects(
          writeDocumentFileAtomically(
            "documents/blocked.pdf",
            Buffer.from("must be cleaned"),
          ),
        );

        const entries = await fs.readdir(path.join(root, "documents"));
        assert.equal(entries.some((entry) => entry.endsWith(".part")), false);
      } finally {
        if (previousRoot === undefined) delete process.env.DOCS_STORAGE_DIR;
        else process.env.DOCS_STORAGE_DIR = previousRoot;
      }
    });
  });
});
