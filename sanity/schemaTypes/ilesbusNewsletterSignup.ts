import { defineField, defineType } from "sanity";

export const ilesbusNewsletterSignup = defineType({
  name: "ilesbusNewsletterSignup",
  title: "Newsletter consent",
  type: "document",
  fields: [
    defineField({
      name: "submittedAt",
      title: "Submitted at",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "subscribed",
      options: {
        list: [
          { title: "Subscribed", value: "subscribed" },
          { title: "Unsubscribed", value: "unsubscribed" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "consents",
      title: "Topics selected",
      type: "object",
      fields: [
        defineField({ name: "news", title: "News", type: "boolean" }),
        defineField({ name: "warranty", title: "Warranty", type: "boolean" }),
        defineField({ name: "sales", title: "Sales", type: "boolean" }),
        defineField({ name: "groupMarketing", title: "Group marketing", type: "boolean" }),
      ],
    }),
    defineField({ name: "consentVersion", title: "Consent version", type: "number" }),
    defineField({ name: "consentStatement", title: "Consent wording", type: "text", rows: 5 }),
    defineField({ name: "captureMethod", title: "Capture method", type: "string" }),
    defineField({ name: "sourceUrl", title: "Source URL", type: "url" }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "submittedAtDesc",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "email",
      submittedAt: "submittedAt",
      status: "status",
      news: "consents.news",
      warranty: "consents.warranty",
      sales: "consents.sales",
      groupMarketing: "consents.groupMarketing",
    },
    prepare({ title, submittedAt, status, news, warranty, sales, groupMarketing }) {
      const date = submittedAt ? new Date(submittedAt).toLocaleDateString("en-GB") : "No date";
      const topics = [
        news && "News",
        warranty && "Warranty",
        sales && "Sales",
        groupMarketing && "Group marketing",
      ].filter(Boolean).join(", ");

      return {
        title: title || "Newsletter subscriber",
        subtitle: `${topics || "No topics"} · ${status || "subscribed"} · ${date}`,
      };
    },
  },
});
