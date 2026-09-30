import { defineField, defineType } from "sanity";

export const staffLoginCode = defineType({
  name: "staffLoginCode",
  title: "Staff login codes",
  type: "document",
  hidden: true,
  fields: [
    defineField({ name: "portalEnvironment", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "codeHash", type: "string" }),
    defineField({ name: "expiresAt", type: "datetime" }),
    defineField({ name: "usedAt", type: "datetime" }),
  ],
});

