import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowPortalLogin } from "../src/lib/deployment/host.ts";

test("shows portal login on the production domain", () => {
  assert.equal(shouldShowPortalLogin("replo.kr"), true);
  assert.equal(shouldShowPortalLogin("www.replo.kr"), true);
  assert.equal(shouldShowPortalLogin("REPLO.KR:443"), true);
});

test("shows portal login during local development", () => {
  assert.equal(shouldShowPortalLogin("localhost:3000"), true);
  assert.equal(shouldShowPortalLogin("127.0.0.1:3000"), true);
});

test("keeps portal login hidden on unknown and preview hosts", () => {
  assert.equal(shouldShowPortalLogin("replo-homepage-example.vercel.app"), false);
  assert.equal(shouldShowPortalLogin(null), false);
});
