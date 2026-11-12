import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { setTimeout } from "node:timers/promises";
import { Client } from "pg";
import { getPayload } from "payload";
import config from "./config.js";

const baseUrl = "http://localhost:3000";
const databaseUri =
  process.env.DATABASE_URI ??
  "postgres://payload:payload@localhost:5432/payload";
const payload = await getPayload({ config });
const observer = new Client({ connectionString: databaseUri });
const email = `repro-${randomUUID()}@example.com`;
const password = randomUUID();
const apiKey = randomUUID();
let server: ReturnType<typeof spawn> | undefined;
let userId: string | number | undefined;
let keyId: string | number | undefined;
let itemId: string | number | undefined;

async function cachedValue(): Promise<unknown> {
  const response = await fetch(`${baseUrl}/cached-items`);
  assert.equal(response.status, 200);
  const docs = (await response.json()) as Array<{
    id: string | number;
    value: unknown;
  }>;
  return docs.find(({ id }) => id === itemId)?.value;
}

try {
  await observer.connect();
  const user = await payload.create({
    collection: "users",
    data: { email, password },
  });
  userId = user.id;
  const key = await payload.create({
    collection: "payload-mcp-api-keys",
    data: {
      label: "Local cache reproduction",
      user: user.id,
      apiKey,
      enableAPIKey: true,
      reproItems: { find: true, update: true },
    },
  });
  keyId = key.id;
  const item = await payload.create({
    collection: "repro_items",
    data: { value: "initial" },
    context: { skipCacheInvalidation: true },
  });
  itemId = item.id;
  server = spawn("corepack", ["pnpm", "dev"], {
    env: { ...process.env, REPRO_RUN_ID: randomUUID() },
    stdio: "inherit",
  });
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null)
      throw new Error("Next.js exited before becoming ready");
    try {
      await cachedValue();
      ready = true;
      break;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      await setTimeout(250);
    }
  }
  assert.equal(ready, true, "Next.js must become ready");
  const initial = await cachedValue();
  assert.equal(
    initial,
    "initial",
    "Each run must start from its own warm cache",
  );
  const mcp = await fetch(`${baseUrl}/api/mcp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "updateReproItems",
        arguments: { id: item.id, value: "via-mcp" },
      },
    }),
  });
  const mcpBody = await mcp.text();
  assert.equal(mcp.status, 200);
  assert.ok(
    mcpBody.includes("updated successfully"),
    "MCP must complete the update",
  );
  const persisted = await observer.query<{ value: string }>(
    "SELECT value FROM repro_items WHERE id = $1",
    [item.id],
  );
  assert.equal(persisted.rows[0]?.value, "via-mcp");
  const afterMcp = await cachedValue();

  const login = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = (await login.json()) as { token?: string };
  assert.ok(session.token);
  const rest = await fetch(`${baseUrl}/api/repro_items/${item.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `JWT ${session.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value: "via-rest" }),
  });
  assert.equal(rest.status, 200);
  const afterRest = await cachedValue();
  console.log(
    JSON.stringify(
      {
        initial,
        storedAfterMcp: persisted.rows[0]?.value,
        cachedAfterMcp: afterMcp,
        cachedAfterRest: afterRest,
      },
      null,
      2,
    ),
  );
  assert.equal(afterRest, "via-rest", "REST control must invalidate the cache");
  assert.equal(
    afterMcp,
    "initial",
    "The reproduction must demonstrate the stale MCP cache",
  );
  console.log(
    "PASS: reproduced stale MCP cache while the REST control invalidates it",
  );
} finally {
  if (server && server.exitCode === null) {
    const closed = once(server, "exit");
    server.kill("SIGTERM");
    await Promise.race([closed, setTimeout(5000)]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
  if (itemId !== undefined)
    await payload.delete({ collection: "repro_items", id: itemId });
  if (keyId !== undefined)
    await payload.delete({ collection: "payload-mcp-api-keys", id: keyId });
  if (userId !== undefined)
    await payload.delete({ collection: "users", id: userId });
  await observer.end();
  await payload.destroy();
}

process.exit(0);
