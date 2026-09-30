import { defineField, defineType } from "sanity";

const field = (name: string, title: string, type: "string" | "text" | "number" | "date" = "string", group?: string) => defineField({ name, title, type, group });

export const financeProposal = defineType({
  name: "financeProposal", title: "Finance Proposal", type: "document",
  groups: [
    { name: "company", title: "Company" }, { name: "bank", title: "Bank" },
    { name: "director1", title: "Director 1" }, { name: "director2", title: "Director 2" }, { name: "declaration", title: "Declaration" },
  ],
  fields: [
    defineField({ name: "submittedAt", title: "Submitted", type: "datetime", readOnly: true }),
    defineField({ name: "status", title: "Proposal status", type: "string", initialValue: "New", options: { list: ["New", "Reviewing", "More information required", "Submitted to funder", "Approved", "Declined", "Completed", "Closed"] } }),
    field("salesPerson", "Automotivate sales person", "string", "company"), field("companyName", "Company name", "string", "company"),
    field("companyRegNumber", "Company registration number", "string", "company"), field("companyVatNumber", "Company VAT number", "string", "company"),
    field("dateOfIncorporation", "Date of incorporation", "date", "company"), field("industryType", "Industry type", "string", "company"),
    field("companyAddress", "Registered / trading address", "text", "company"), field("premisesStatus", "Premises status", "string", "company"), field("companyMovedIn", "Date moved in", "date", "company"),
    field("bankName", "Bank", "string", "bank"), field("bankAccountNumber", "Account number", "string", "bank"), field("bankSortCode", "Sort code", "string", "bank"),
    field("bankAddress", "Bank address", "text", "bank"), field("yearsWithBank", "Years with bank", "number", "bank"),
    field("director1FirstName", "First name", "string", "director1"), field("director1LastName", "Last name", "string", "director1"),
    field("director1Email", "Email", "string", "director1"), field("director1Mobile", "Mobile", "string", "director1"), field("director1DateOfBirth", "Date of birth", "date", "director1"),
    field("director1MaritalStatus", "Marital status", "string", "director1"), field("director1Address", "Home address", "text", "director1"), field("director1YearsAtAddress", "Years at address", "number", "director1"), field("director1PropertyStatus", "Property status", "string", "director1"),
    field("director2FirstName", "First name", "string", "director2"), field("director2LastName", "Last name", "string", "director2"),
    field("director2Email", "Email", "string", "director2"), field("director2Mobile", "Mobile", "string", "director2"), field("director2DateOfBirth", "Date of birth", "date", "director2"),
    field("director2MaritalStatus", "Marital status", "string", "director2"), field("director2Address", "Home address", "text", "director2"), field("director2YearsAtAddress", "Years at address", "number", "director2"), field("director2PropertyStatus", "Property status", "string", "director2"),
    field("signatoryName", "Name of signatory", "string", "declaration"), field("signatureDate", "Date of signature", "date", "declaration"),
    defineField({ name: "declarationAccepted", title: "Finance declaration accepted", type: "boolean", readOnly: true, group: "declaration" }),
    defineField({ name: "privacyAccepted", title: "Privacy confirmation accepted", type: "boolean", readOnly: true, group: "declaration" }),
  ],
  preview: { select: { company: "companyName", reg: "companyRegNumber", status: "status", submitted: "submittedAt" }, prepare: ({ company, reg, status, submitted }) => ({ title: company || "Finance proposal", subtitle: `${status || "New"} · ${reg || "No company number"} · ${submitted ? new Date(submitted).toLocaleString("en-GB") : ""}` }) },
  orderings: [{ title: "Newest first", name: "submittedAtDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
});
