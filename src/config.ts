import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";
import { mcpPlugin } from "@payloadcms/plugin-mcp";
import { revalidateTag } from "next/cache.js";
import { setTimeout } from "node:timers/promises";

import { ReproItems } from "./collections/ReproItems";

const databaseUri =
  process.env.DATABASE_URI ??
  "postgres://payload:payload@localhost:5432/payload";

export default buildConfig({
  admin: { user: "users" },
  collections: [
    { slug: "users", auth: true, fields: [] },
    {
      ...ReproItems,
      hooks: {
        afterChange: [
          async ({ doc, req }) => {
            if (!req.context.skipCacheInvalidation) {
              await setTimeout(25);
              revalidateTag("repro-items", { expire: 0 });
            }
            return doc;
          },
        ],
      },
    },
  ],
  plugins: [
    mcpPlugin({
      userCollection: "users",
      collections: {
        repro_items: {
          enabled: { find: true, create: true, update: true, delete: false },
        },
      },
    }),
  ],
  db: postgresAdapter({
    pool: {
      connectionString: databaseUri,
    },
    push: true,
  }),
  secret: process.env.PAYLOAD_SECRET ?? "payload-test-repo-development-secret",
});
