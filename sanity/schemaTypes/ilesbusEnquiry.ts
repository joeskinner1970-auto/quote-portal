import { defineField, defineType } from "sanity";

export const ilesbusEnquiry = defineType({
  name: "ilesbusEnquiry",
  title: "Ilesbus enquiry",
  type: "document",
  fields: [
    defineField({ name: "submittedAt", title: "Submitted at", type: "datetime", validation: (Rule) => Rule.required() }),
    defineField({
      name: "status", title: "Status", type: "string", initialValue: "new",
      options: { list: [{ title: "New", value: "new" }, { title: "In progress", value: "inProgress" }, { title: "Closed", value: "closed" }], layout: "radio" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "enquiryType", title: "Enquiry type", type: "string",
      options: { list: [{ title: "Product / sales", value: "sales" }, { title: "Configurator", value: "configurator" }, { title: "Warranty", value: "warranty" }] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "enquiryTopic", title: "Enquiry topic", type: "string" }),
    defineField({ name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "company", title: "Company", type: "string" }),
    defineField({ name: "email", title: "Email", type: "string", validation: (Rule) => Rule.required().email() }),
    defineField({ name: "phone", title: "Phone", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "selectedModel", title: "Selected model", type: "string" }),
    defineField({ name: "configuration", title: "Configuration summary", type: "text", rows: 8 }),
    defineField({ name: "message", title: "Message", type: "text", rows: 8, validation: (Rule) => Rule.required() }),
    defineField({ name: "consent", title: "Contact consent recorded", type: "boolean", validation: (Rule) => Rule.required() }),
    defineField({ name: "sourceUrl", title: "Source URL", type: "url" }),
    defineField({ name: "assignedTo", title: "Assigned to", type: "string" }),
    defineField({ name: "internalNotes", title: "Internal notes", type: "text", rows: 5 }),
  ],
  orderings: [{ title: "Newest first", name: "submittedAtDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { title: "name", company: "company", type: "enquiryType", status: "status", submittedAt: "submittedAt" },
    prepare({ title, company, type, status, submittedAt }) {
      const date = submittedAt ? new Date(submittedAt).toLocaleDateString("en-GB") : "No date";
      return { title: `${title || "Unnamed enquiry"}${company ? ` · ${company}` : ""}`, subtitle: `${type || "Uncategorised"} · ${status || "new"} · ${date}` };
    },
  },
});
