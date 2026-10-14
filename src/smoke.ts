import { Client } from "pg";
import { getPayload } from "payload";

import config from "./config.js";

const databaseUri =
  process.env.DATABASE_URI ??
  "postgres://payload:payload@localhost:5432/payload";

const main = async (): Promise<void> => {
  const observer = new Client({ connectionString: databaseUri });
  const payload = await getPayload({ config });
  const value = `smoke-${Date.now()}`;

  try {
    await observer.connect();

    const transactionID = await payload.db.beginTransaction();
    if (transactionID === null) {
      throw new Error("Payload did not create a transaction");
    }

    try {
      await payload.create({
        collection: "repro_items",
        data: { value },
        req: { transactionID },
      });
      await payload.db.commitTransaction(transactionID);
    } catch (error) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
      throw error;
    }

    const result = await observer.query<{ value: string }>(
      "SELECT value FROM repro_items WHERE value = $1",
      [value],
    );
    if (result.rowCount !== 1) {
      throw new Error("Payload transaction did not persist the smoke-test row");
    }

    console.log("PASS: normal Payload transaction committed a row");
  } finally {
    await observer.end();
    await payload.destroy();
  }
};

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
