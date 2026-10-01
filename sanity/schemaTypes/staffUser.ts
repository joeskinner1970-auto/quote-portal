import { defineField, defineType } from "sanity";

export const staffUser = defineType({
  name: "staffUser",
  title: "Quote portal users",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "email", title: "Email", type: "string", validation: (rule) => rule.required().email() }),
    defineField({ name: "hubspotUserId", title: "HubSpot User ID", type: "string", description: "Used to assign new HubSpot deals to this portal user." }),
    defineField({ name: "passwordHash", title: "Password hash", type: "string", hidden: true, readOnly: true }),
    defineField({
      name: "role",
      title: "Access level",
      type: "string",
      initialValue: "sales",
      options: { list: [{ title: "Sales: new quotes only", value: "sales" }, { title: "Management: all quote records", value: "management" }] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "active", title: "Active", type: "boolean", initialValue: true }),
  ],
  preview: { select: { title: "name", subtitle: "email" } },
});

