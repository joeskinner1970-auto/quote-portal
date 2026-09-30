import { defineArrayMember, defineField, defineType } from "sanity";

export const article = defineType({
  name: "article",
  title: "News Article",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Article title",
      type: "string",
      description: "Maximum 60 characters.",
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: "slug", title: "Page URL", type: "slug", options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "summary", title: "Short summary", type: "text", rows: 3, validation: (rule) => rule.required().max(300) }),
    defineField({
      name: "category", title: "Category", type: "string",
      options: { list: ["Fleet insights", "From the Director", "Finance", "Electric vehicles", "Minibus", "Company news"] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "author", title: "Author", type: "string", initialValue: "Automotivate", validation: (rule) => rule.required() }),
    defineField({ name: "publishedAt", title: "Publication date", type: "datetime", initialValue: () => new Date().toISOString(), validation: (rule) => rule.required() }),
    defineField({
      name: "image", title: "Main image", type: "image", options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Image description", type: "string" })],
    }),
    defineField({ name: "featured", title: "Feature on News page", type: "boolean", initialValue: false }),
    defineField({ name: "published", title: "Show on website", type: "boolean", initialValue: false }),
    defineField({
      name: "body",
      title: "Article content",
      description: "Add paragraphs, headings, lists, images, spacing and tables in any order.",
      type: "array",
      validation: (rule) => rule.required(),
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Heading 4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet list", value: "bullet" },
            { title: "Numbered list", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
              { title: "Underline", value: "underline" },
              { title: "Code", value: "code" },
            ],
            annotations: [
              defineArrayMember({
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  defineField({
                    name: "href",
                    type: "url",
                    title: "Web address",
                    validation: (rule) =>
                      rule.required().uri({ scheme: ["http", "https", "mailto", "tel"] }),
                  }),
                  defineField({ name: "openInNewTab", type: "boolean", title: "Open in a new tab", initialValue: false }),
                ],
              }),
            ],
          },
        }),
        defineArrayMember({
          type: "image",
          title: "Image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Image description", type: "string" }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
        }),
        defineArrayMember({
          name: "spacer",
          title: "Paragraph spacing",
          type: "object",
          fields: [
            defineField({
              name: "size",
              title: "Amount of space",
              type: "string",
              initialValue: "medium",
              options: {
                layout: "radio",
                list: [
                  { title: "Small", value: "small" },
                  { title: "Medium", value: "medium" },
                  { title: "Large", value: "large" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { size: "size" },
            prepare: ({ size }) => ({ title: `Paragraph spacing: ${size || "medium"}` }),
          },
        }),
        defineArrayMember({
          name: "articleTable",
          title: "Table",
          type: "object",
          fields: [
            defineField({ name: "caption", title: "Table caption", type: "string" }),
            defineField({
              name: "hasHeaderRow",
              title: "Use first row as headings",
              type: "boolean",
              initialValue: true,
            }),
            defineField({
              name: "rows",
              title: "Rows",
              type: "array",
              validation: (rule) => rule.required().min(1),
              of: [
                defineArrayMember({
                  name: "tableRow",
                  title: "Row",
                  type: "object",
                  fields: [
                    defineField({
                      name: "cells",
                      title: "Cells",
                      description: "Add one cell for each column, in left-to-right order.",
                      type: "array",
                      validation: (rule) => rule.required().min(1),
                      of: [defineArrayMember({ type: "string" })],
                    }),
                  ],
                  preview: {
                    select: { cells: "cells" },
                    prepare: ({ cells }) => ({
                      title: Array.isArray(cells) && cells.length ? cells.join(" | ") : "Empty row",
                    }),
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { caption: "caption", rows: "rows" },
            prepare: ({ caption, rows }) => ({
              title: caption || "Table",
              subtitle: `${Array.isArray(rows) ? rows.length : 0} rows`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "relatedArticles",
      title: "Related articles",
      description: "Choose up to five closely related articles. Category and recent-post fallbacks are used when fewer are selected.",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "article" }] })],
      validation: (rule) => rule.unique().max(5),
    }),
    defineField({
      name: "relevantServices",
      title: "Relevant services",
      description: "Link this guide back to the most useful service or sector pages.",
      type: "array",
      of: [defineArrayMember({
        type: "string",
        options: {
          list: [
            { title: "Vehicle sourcing", value: "/vehicles" },
            { title: "Conversions", value: "/conversions" },
            { title: "Business finance", value: "/finance" },
            { title: "Stock vehicles", value: "/stock" },
            { title: "Fleet management", value: "/fleet-management" },
            { title: "Fleet services", value: "/fleet-services" },
            { title: "Minibus", value: "/minibus" },
            { title: "Traffic management", value: "/traffic-management" },
            { title: "Construction", value: "/construction" },
            { title: "Delivery", value: "/delivery" },
            { title: "Mobile solutions", value: "/mobile-solutions" },
            { title: "Blue light fleets", value: "/blue-light-fleets" },
          ],
        },
      })],
      validation: (rule) => rule.unique().max(4),
    }),
    defineField({ name: "seoTitle", title: "SEO title", type: "string", validation: (rule) => rule.max(60) }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 3,
      description: "Maximum 160 characters.",
      validation: (rule) => rule.max(160),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "category", media: "image" },
  },
});
