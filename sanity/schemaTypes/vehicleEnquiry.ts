import { defineField, defineType } from "sanity";

export const vehicleEnquiry = defineType({
  name: "vehicleEnquiry", title: "Vehicle Enquiry", type: "document",
  fields: [
    defineField({ name: "submittedAt", title: "Submitted", type: "datetime", readOnly: true }),
    defineField({ name: "status", title: "Enquiry status", type: "string", initialValue: "New", options: { list: ["New", "Contacted", "Quoted", "Won", "Lost", "Closed"] } }),
    defineField({ name: "companyName", title: "Company name", type: "string" }), defineField({ name: "address", title: "Address", type: "string" }),
    defineField({ name: "website", title: "Website", type: "string" }), defineField({ name: "firstName", title: "First name", type: "string" }), defineField({ name: "lastName", title: "Last name", type: "string" }),
    defineField({ name: "phone", title: "Phone", type: "string" }), defineField({ name: "email", title: "Email", type: "string" }),
    defineField({ name: "customerType", title: "Customer type", type: "string" }), defineField({ name: "vatRegistered", title: "VAT registered", type: "string" }),
    defineField({ name: "industrySector", title: "Industry / sector", type: "string" }), defineField({ name: "fleetSize", title: "Fleet size", type: "number" }), defineField({ name: "bestTimeToContact", title: "Best time to contact", type: "string" }),
    defineField({ name: "brandPreferences", title: "Brand preferences", type: "string" }), defineField({ name: "requiredPayload", title: "Required payload", type: "string" }),
    defineField({ name: "vehicleLength", title: "Vehicle length", type: "string" }), defineField({ name: "vehicleHeight", title: "Vehicle height", type: "string" }), defineField({ name: "bodyType", title: "Body type", type: "string" }),
    defineField({ name: "colourChoice", title: "Colour choice", type: "string" }), defineField({ name: "specification", title: "Specification & optional equipment", type: "text" }), defineField({ name: "vehicleUsage", title: "Vehicle usage", type: "text" }),
    defineField({ name: "purchaseMethod", title: "How vehicles are purchased", type: "string" }), defineField({ name: "monthlyBudget", title: "Monthly budget (£)", type: "number" }),
    defineField({ name: "totalBudget", title: "Total purchase budget (£)", type: "number" }), defineField({ name: "initialDeposit", title: "Initial deposit / part exchange (£)", type: "number" }),
    defineField({ name: "ownershipTerm", title: "Preferred ownership term", type: "string" }), defineField({ name: "annualMileage", title: "Annual mileage", type: "number" }),
    defineField({ name: "vehiclesRequired", title: "When vehicles are required", type: "string" }), defineField({ name: "additionalNotes", title: "Additional notes", type: "text" }),
    defineField({ name: "consent", title: "Contact consent provided", type: "boolean", readOnly: true }),
  ],
  preview: { select: { company: "companyName", first: "firstName", last: "lastName", status: "status", submitted: "submittedAt" }, prepare: ({ company, first, last, status, submitted }) => ({ title: company || `${first || ""} ${last || ""}`.trim(), subtitle: `${status || "New"} · ${submitted ? new Date(submitted).toLocaleString("en-GB") : ""}` }) },
  orderings: [{ title: "Newest first", name: "submittedAtDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
});
