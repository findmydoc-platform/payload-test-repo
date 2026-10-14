import { Client } from "pg";
import { getPayload } from "payload";

import config from "./config.js";

const databaseUri =
  process.env.DATABASE_URI ??
  "postgres://payload:payload@localhost:5432/payload";
const triggerFunction = "repro_raise_at_commit";
const triggerName = "repro_raise_at_commit_trigger";

const main = async (): Promise<void> => {
  const observer = new Client({ connectionString: databaseUri });
  const payload = await getPayload({ config });
  const value = `commit-error-${Date.now()}`;

  try {
    await observer.connect();

    await observer.query(
      `DROP TRIGGER IF EXISTS ${triggerName} ON repro_items`,
    );
    await observer.query(`DROP FUNCTION IF EXISTS ${triggerFunction}()`);
    await observer.query(`
      CREATE FUNCTION ${triggerFunction}()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RAISE EXCEPTION 'synthetic deferred COMMIT failure'
          USING ERRCODE = '23514';
      END;
      $$
    `);
    await observer.query(`
      CREATE CONSTRAINT TRIGGER ${triggerName}
      AFTER INSERT ON repro_items
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
      EXECUTE FUNCTION ${triggerFunction}()
    `);

    const transactionID = await payload.db.beginTransaction();
    if (transactionID === null) {
      throw new Error("Payload did not create a transaction");
    }

    await payload.create({
      collection: "repro_items",
      data: { value },
      req: { transactionID },
    });

    let commitResolved = false;
    let commitError: unknown = null;
    try {
      await payload.db.commitTransaction(transactionID);
      commitResolved = true;
    } catch (error: unknown) {
      commitError = error;
    }

    const result = await observer.query<{ value: string }>(
      "SELECT value FROM repro_items WHERE value = $1",
      [value],
    );

    if (!commitResolved || commitError !== null || result.rowCount !== 0) {
      throw new Error(
        `Expected swallowed COMMIT error, got commitResolved=${commitResolved}, commitError=${commitError !== null}, persistedRows=${result.rowCount}`,
      );
    }

    console.log(
      `REPRODUCED: commitTransaction resolved, PostgreSQL rolled back, persisted rows: ${result.rowCount}`,
    );
  } finally {
    await observer
      .query(`DROP TRIGGER IF EXISTS ${triggerName} ON repro_items`)
      .catch(() => undefined);
    await observer
      .query(`DROP FUNCTION IF EXISTS ${triggerFunction}()`)
      .catch(() => undefined);
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
