import { defineField, defineType } from "sanity";

export const generalEnquiry = defineType({
  name: "generalEnquiry", title: "General Enquiry", type: "document",
  fields: [
    defineField({ name: "submittedAt", title: "Submitted", type: "datetime", readOnly: true }),
    defineField({ name: "status", title: "Enquiry status", type: "string", initialValue: "New", options: { list: ["New", "Contacted", "Quoted", "Won", "Lost", "Closed"] } }),
    defineField({ name: "name", title: "Name", type: "string" }),
    defineField({ name: "company", title: "Company", type: "string" }),
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({ name: "interest", title: "What can we help with?", type: "string" }),
    defineField({ name: "selectedVehicle", title: "Selected vehicle", type: "string", readOnly: true }),
    defineField({ name: "message", title: "Message", type: "text" }),
    defineField({ name: "consent", title: "Contact consent provided", type: "boolean", readOnly: true }),
  ],
  preview: { select: { name: "name", company: "company", interest: "interest", status: "status", submitted: "submittedAt" }, prepare: ({ name, company, interest, status, submitted }) => ({ title: company ? `${name}, ${company}` : name, subtitle: `${status || "New"} · ${interest || "General"} · ${submitted ? new Date(submitted).toLocaleString("en-GB") : ""}` }) },
  orderings: [{ title: "Newest first", name: "submittedAtDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
});
