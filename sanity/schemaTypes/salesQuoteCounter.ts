import { defineField, defineType } from "sanity";

export const salesQuoteCounter = defineType({
  name: "salesQuoteCounter", title: "Sales quote counter", type: "document", hidden: true,
  fields: [defineField({ name: "portalEnvironment", type: "string", readOnly: true, hidden: true }),defineField({ name: "nextNumber", type: "number", readOnly: true })],
});

