import { defineField, defineType } from "sanity";

export const quoteVehicleImport = defineType({
  name: "quoteVehicleImport",
  title: "Vehicle catalogue import",
  type: "document",
  readOnly: true,
  fields: [
    defineField({ name: "portalEnvironment", title: "Environment", type: "string", readOnly: true }),
    defineField({ name: "fileName", title: "Source file", type: "string", readOnly: true }),
    defineField({ name: "importedAt", title: "Published at", type: "datetime", readOnly: true }),
    defineField({ name: "importedBy", title: "Published by", type: "string", readOnly: true }),
    defineField({ name: "recordCount", title: "Published records", type: "number", readOnly: true }),
    defineField({ name: "added", title: "Added", type: "number", readOnly: true }),
    defineField({ name: "changed", title: "Changed", type: "number", readOnly: true }),
    defineField({ name: "disabled", title: "Disabled", type: "number", readOnly: true }),
    defineField({ name: "rolledBackFrom", title: "Rollback source", type: "string", readOnly: true }),
    defineField({ name: "previousCatalogue", title: "Previous catalogue", type: "array", readOnly: true, of: [{ type: "object", fields: [
      defineField({ name: "sourceId", type: "string" }), defineField({ name: "make", type: "string" }), defineField({ name: "model", type: "string" }),
      defineField({ name: "variant", type: "string" }), defineField({ name: "modelYear", type: "string" }),
      defineField({ name: "basicListPrice", type: "number" }), defineField({ name: "transmission", type: "string" }), defineField({ name: "bodyType", type: "string" }),
      defineField({ name: "co2", type: "number" }), defineField({ name: "p11d", type: "number" }),
      defineField({ name: "active", type: "boolean" }), defineField({ name: "priceCheckedAt", type: "date" }), defineField({ name: "managementNotes", type: "text" }),
    ] }]}),
  ],
  preview: { select: { title: "fileName", date: "importedAt", by: "importedBy" }, prepare: ({ title, date, by }) => ({ title: title || "Catalogue update", subtitle: `${date ? new Date(date).toLocaleString("en-GB") : ""}${by ? ` by ${by}` : ""}` }) },
});

