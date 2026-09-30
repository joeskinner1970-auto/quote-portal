import { defineField, defineType } from "sanity";

export const review = defineType({
  name: "review",
  title: "Reviews",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "company", title: "Company", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "reviewDate", title: "Date of review", type: "date", initialValue: () => new Date().toISOString().slice(0, 10), validation: (rule) => rule.required() }),
    defineField({
      name: "rating",
      title: "Star rating",
      type: "number",
      options: { list: [
        { title: "★★★★★: 5 stars", value: 5 },
        { title: "★★★★☆: 4 stars", value: 4 },
        { title: "★★★☆☆: 3 stars", value: 3 },
        { title: "★★☆☆☆: 2 stars", value: 2 },
        { title: "★☆☆☆☆: 1 star", value: 1 },
      ], layout: "radio" },
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({ name: "comment", title: "Comment", type: "text", rows: 7, validation: (rule) => rule.required() }),
    defineField({ name: "published", title: "Show on website", type: "boolean", initialValue: false }),
  ],
  orderings: [{ title: "Review date, newest", name: "reviewDateDesc", by: [{ field: "reviewDate", direction: "desc" }] }],
  preview: {
    select: { name: "name", company: "company", rating: "rating" },
    prepare: ({ name, company, rating }) => ({ title: name, subtitle: `${"★".repeat(rating || 0)}${company ? ` · ${company}` : ""}` }),
  },
});
