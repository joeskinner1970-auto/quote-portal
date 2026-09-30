import { defineField, defineType } from "sanity";

export const ilesbusFaq = defineType({
  name: "ilesbusFaq",
  title: "Ilesbus FAQ",
  type: "document",
  fields: [
    defineField({ name: "question", title: "Question", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "answer", title: "Answer", type: "text", rows: 6, validation: (Rule) => Rule.required() }),
    defineField({ name: "page", title: "Show on", type: "string", options: { list: [{ title: "Products", value: "products" }, { title: "Warranty", value: "warranty" }, { title: "Contact", value: "contact" }] }, validation: (Rule) => Rule.required() }),
    defineField({ name: "displayOrder", title: "Display order", type: "number", initialValue: 0, validation: (Rule) => Rule.required().integer() }),
  ],
  orderings: [{ title: "Website order", name: "displayOrder", by: [{ field: "displayOrder", direction: "asc" }] }],
});
