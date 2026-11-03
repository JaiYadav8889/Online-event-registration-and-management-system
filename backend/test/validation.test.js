import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

test("ticket codes generated from cryptographic randomness are unique", () => {
  const codes = new Set(Array.from({ length: 1000 }, () => randomBytes(18).toString("hex")));
  assert.equal(codes.size, 1000);
});

test("ticket code format is sufficiently long for opaque identifiers", () => {
  const code = randomBytes(18).toString("hex");
  assert.match(code, /^[a-f0-9]{36}$/);
});
