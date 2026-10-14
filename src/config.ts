import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";

import { ReproItems } from "./collections/ReproItems.js";

const databaseUri =
  process.env.DATABASE_URI ??
  "postgres://payload:payload@localhost:5432/payload";

export default buildConfig({
  collections: [ReproItems],
  db: postgresAdapter({
    pool: {
      connectionString: databaseUri,
    },
    push: true,
  }),
  secret: process.env.PAYLOAD_SECRET ?? "payload-test-repo-development-secret",
});
