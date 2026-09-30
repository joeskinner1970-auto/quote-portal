import { defineField, defineType } from "sanity";

export const ilesbusVehicleCategory = defineType({
  name: "ilesbusVehicleCategory",
  title: "Ilesbus vehicle category",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Category name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (Rule) => Rule.required() }),
    defineField({ name: "summary", title: "Summary", type: "text", rows: 3 }),
    defineField({ name: "displayOrder", title: "Display order", type: "number", initialValue: 0, validation: (Rule) => Rule.required().integer() }),
  ],
  orderings: [{ title: "Website order", name: "displayOrder", by: [{ field: "displayOrder", direction: "asc" }] }],
});
