import { defineArrayMember, defineField, defineType } from "sanity";

export const ilesbusVehicle = defineType({
  name: "ilesbusVehicle",
  title: "Ilesbus vehicle",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Model name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name" }, validation: (Rule) => Rule.required() }),
    defineField({ name: "category", title: "Category", type: "reference", to: [{ type: "ilesbusVehicleCategory" }], validation: (Rule) => Rule.required() }),
    defineField({ name: "summary", title: "Short summary", type: "text", rows: 3, validation: (Rule) => Rule.required().max(260) }),
    defineField({ name: "status", title: "Website status", type: "string", initialValue: "published", options: { list: [{ title: "Published", value: "published" }, { title: "Hidden", value: "hidden" }] }, validation: (Rule) => Rule.required() }),
    defineField({ name: "featuredOnHome", title: "Feature on homepage", type: "boolean", initialValue: false }),
    defineField({ name: "displayOrder", title: "Display order", type: "number", initialValue: 0, validation: (Rule) => Rule.required().integer() }),
    defineField({
      name: "heroImage", title: "Primary image", type: "image", options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alternative text", type: "string", validation: (Rule) => Rule.required().warning("Describe the vehicle for people who cannot see the image.") })],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "gallery", title: "Image gallery", type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true }, fields: [
        defineField({ name: "alt", title: "Alternative text", type: "string", validation: (Rule) => Rule.required() }),
        defineField({ name: "caption", title: "Caption", type: "string" }),
      ] })],
    }),
    defineField({ name: "body", title: "Model content", type: "array", of: [defineArrayMember({ type: "block" })] }),
    defineField({ name: "seoTitle", title: "SEO title", type: "string", validation: (Rule) => Rule.max(65) }),
    defineField({ name: "seoDescription", title: "SEO description", type: "text", rows: 3, validation: (Rule) => Rule.max(170) }),
  ],
  orderings: [{ title: "Website order", name: "displayOrder", by: [{ field: "displayOrder", direction: "asc" }] }],
});
