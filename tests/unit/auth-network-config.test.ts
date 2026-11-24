import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveAuthNetworkConfig,
  resolveAuthSecret,
} from "../../lib/auth-network-config";

describe("auth network configuration", () => {
  it("keeps loopback conveniences development-only", () => {
    const development = resolveAuthNetworkConfig({
      NODE_ENV: "development",
      BETTER_AUTH_URL: "http://127.0.0.1:3100",
    });
    const production = resolveAuthNetworkConfig({
      NODE_ENV: "production",
      BETTER_AUTH_URL: "https://cyberdoc.example",
    });

    assert.deepEqual(development.trustedOrigins, [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://127.0.0.1:3100",
    ]);
    assert.deepEqual(production.trustedOrigins, ["https://cyberdoc.example"]);
    assert.deepEqual(production.trustedProxies, []);
    assert.deepEqual(production.ipAddressHeaders, []);
  });

  it("uses Vercel's overwritten client IP header", () => {
    const config = resolveAuthNetworkConfig({
      NODE_ENV: "production",
      VERCEL: "1",
      BETTER_AUTH_URL: "https://cyberdoc.example",
    });

    assert.deepEqual(config.ipAddressHeaders, ["x-vercel-forwarded-for"]);
    assert.deepEqual(config.trustedProxies, []);
  });

  it("accepts only explicit IP or CIDR trusted proxies", () => {
    const config = resolveAuthNetworkConfig({
      NODE_ENV: "production",
      BETTER_AUTH_URL: "https://cyberdoc.example",
      BETTER_AUTH_TRUSTED_PROXIES:
        "127.0.0.1,10.20.0.0/24,2001:db8::/32,127.0.0.1",
    });

    assert.deepEqual(config.trustedProxies, [
      "127.0.0.1",
      "10.20.0.0/24",
      "2001:db8::/32",
    ]);
    assert.deepEqual(config.ipAddressHeaders, ["x-forwarded-for"]);
    for (const value of ["proxy.local", "10.0.0.1/33", "2001:db8::/129"]) {
      assert.throws(
        () =>
          resolveAuthNetworkConfig({
            NODE_ENV: "production",
            BETTER_AUTH_URL: "https://cyberdoc.example",
            BETTER_AUTH_TRUSTED_PROXIES: value,
          }),
        /exact IP addresses or CIDR ranges/i,
      );
    }
  });

  it("accepts only explicit exact additional origins", () => {
    const config = resolveAuthNetworkConfig({
      NODE_ENV: "production",
      BETTER_AUTH_URL: "https://cyberdoc.example/api/auth",
      BETTER_AUTH_TRUSTED_ORIGINS:
        "https://admin.cyberdoc.example,https://preview.cyberdoc.example",
    });

    assert.equal(config.baseURL, "https://cyberdoc.example/api/auth");
    assert.deepEqual(config.trustedOrigins, [
      "https://cyberdoc.example",
      "https://admin.cyberdoc.example",
      "https://preview.cyberdoc.example",
    ]);
  });

  it("fails closed without a canonical production URL", () => {
    assert.throws(
      () => resolveAuthNetworkConfig({ NODE_ENV: "production" }),
      /canonical authentication URL/i,
    );
  });

  it("uses the current Vercel deployment URL only in a verified Vercel environment", () => {
    const preview = resolveAuthNetworkConfig({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_URL: "cyber-doc-git-release.example.vercel.app",
    });

    assert.equal(preview.baseURL, "https://cyber-doc-git-release.example.vercel.app");
    assert.deepEqual(preview.trustedOrigins, [
      "https://cyber-doc-git-release.example.vercel.app",
    ]);
    assert.throws(
      () =>
        resolveAuthNetworkConfig({
          NODE_ENV: "production",
          VERCEL_URL: "unverified.example.vercel.app",
        }),
      /canonical authentication URL/i,
    );
  });

  it("rejects a malformed Vercel deployment hostname", () => {
    assert.throws(
      () =>
        resolveAuthNetworkConfig({
          NODE_ENV: "production",
          VERCEL: "1",
          VERCEL_URL: "preview.example.vercel.app/path",
        }),
      /must not include a path/i,
    );
  });

  it("rejects insecure non-loopback production URLs and origins with paths", () => {
    assert.throws(
      () =>
        resolveAuthNetworkConfig({
          NODE_ENV: "production",
          BETTER_AUTH_URL: "http://cyberdoc.example",
        }),
      /HTTPS/,
    );
    assert.throws(
      () =>
        resolveAuthNetworkConfig({
          NODE_ENV: "production",
          BETTER_AUTH_URL: "https://cyberdoc.example",
          BETTER_AUTH_TRUSTED_ORIGINS: "https://admin.cyberdoc.example/path",
        }),
      /must not include a path/i,
    );
  });

  it("requires a high-entropy-sized authentication secret in production", () => {
    assert.throws(
      () => resolveAuthSecret({ NODE_ENV: "production" }),
      /at least 32 characters/,
    );
    assert.throws(
      () => resolveAuthSecret({ NODE_ENV: "production", BETTER_AUTH_SECRET: "short" }),
      /at least 32 characters/,
    );
    assert.equal(
      resolveAuthSecret({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "x".repeat(32),
      }),
      "x".repeat(32),
    );
  });
});
