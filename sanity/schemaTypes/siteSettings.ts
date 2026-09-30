import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Website settings",
  type: "document",
  groups: [
    { name: "contact", title: "Contact details" },
    { name: "footer", title: "Footer" },
    { name: "seo", title: "Default SEO" },
  ],
  fields: [
    defineField({ name: "displayName", title: "Display name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "phone", title: "Phone number", type: "string", group: "contact" }),
    defineField({ name: "email", title: "Email address", type: "string", group: "contact", validation: (Rule) => Rule.email() }),
    defineField({
      name: "tradingAddress",
      title: "Trading address",
      type: "array",
      of: [{ type: "string" }],
      group: "contact",
      validation: (Rule) => Rule.max(6),
    }),
    defineField({ name: "footerIntroduction", title: "Footer introduction", type: "text", rows: 3, group: "footer" }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      group: "footer",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "url", title: "URL", type: "url", validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }).required() }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        },
      ],
    }),
    defineField({ name: "defaultSeoTitle", title: "Default SEO title", type: "string", group: "seo", validation: (Rule) => Rule.max(60) }),
    defineField({ name: "defaultSeoDescription", title: "Default SEO description", type: "text", rows: 3, group: "seo", validation: (Rule) => Rule.max(160) }),
  ],
  preview: { select: { title: "displayName" } },
});
