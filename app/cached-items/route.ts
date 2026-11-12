import { getPayload } from "payload";
import { unstable_cache } from "next/cache";
import config from "../../src/config";

export const dynamic = "force-dynamic";

const readItems = unstable_cache(
  async () => {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "repro_items",
      depth: 0,
      limit: 100,
    });
    return result.docs.map(({ id, value }) => ({ id, value }));
  },
  ["repro-items", process.env.REPRO_RUN_ID ?? "manual"],
  { tags: ["repro-items"] },
);

export async function GET() {
  return Response.json(await readItems());
}
