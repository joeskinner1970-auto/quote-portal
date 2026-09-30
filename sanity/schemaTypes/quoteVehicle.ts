import { defineField, defineType } from "sanity";

export const quoteVehicle = defineType({
  name: "quoteVehicle",
  title: "Quote vehicle and pricing data",
  type: "document",
  fields: [
    defineField({ name: "portalEnvironment", title: "Portal environment", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "sourceId", title: "Source record ID", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "make", title: "Make", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "model", title: "Model", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "variant", title: "Variant", type: "string" }),
    defineField({ name: "modelYear", title: "Model year", type: "string" }),
    defineField({ name: "basicListPrice", title: "Basic list price", type: "number", validation: (rule) => rule.required().min(0) }),
    defineField({ name: "transmission", title: "Transmission", type: "string" }),
    defineField({ name: "bodyType", title: "Body type", type: "string" }),
    defineField({ name: "co2", title: "CO₂", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "p11d", title: "P11D", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "delivery", title: "PDI & Delivery", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "rfl", title: "RFL", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "firstRegistrationFee", title: "First reg fee", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "active", title: "Available to sales", type: "boolean", initialValue: true }),
    defineField({ name: "priceCheckedAt", title: "Price checked date", type: "date" }),
    defineField({ name: "managementNotes", title: "Management notes", type: "text" }),
    defineField({ name: "updatedAt", title: "Last updated", type: "datetime", readOnly: true }),
    defineField({ name: "updatedBy", title: "Updated by", type: "string", readOnly: true }),
  ],
  preview: { select: { make: "make", model: "model", price: "basicListPrice" }, prepare: ({ make, model, price }) => ({ title: `${make || ""} ${model || ""}`.trim(), subtitle: typeof price === "number" ? `£${price.toLocaleString("en-GB", { minimumFractionDigits: 2 })}` : "Price not set" }) },
});

