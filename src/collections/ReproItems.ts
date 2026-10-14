import type { CollectionConfig } from "payload";

export const ReproItems: CollectionConfig = {
  fields: [
    {
      name: "value",
      required: true,
      type: "text",
    },
  ],
  slug: "repro_items",
};
