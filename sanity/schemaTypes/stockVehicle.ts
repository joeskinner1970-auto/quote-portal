import { defineField, defineType } from "sanity";

export const stockVehicle = defineType({
  name: "stockVehicle",
  title: "Stock Vehicle",
  type: "document",
  fields: [
    defineField({ name: "make", title: "Manufacturer", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "model", title: "Model and derivative", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "status", title: "Status", type: "string",
      options: { list: ["New", "Pre-Reg", "Pre-registered", "Used", "In build", "Reserved"] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "stockNumber", title: "Stock number", type: "string" }),
    defineField({ name: "priceExVat", title: "Pre-VAT price (£)", type: "number", validation: (rule) => rule.required().positive() }),
    defineField({ name: "vat", title: "VAT (£)", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "rfl", title: "Road Fund Licence (£)", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "firstRegistrationFee", title: "First-registration fee (£)", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "totalPrice", title: "Total price (£)", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "registration", title: "Registration number or plate", type: "string" }),
    defineField({ name: "registeredAt", title: "Registration date", type: "date" }),
    defineField({ name: "mileage", title: "Mileage", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "delivery", title: "Delivery time", type: "string", description: "For example: 14 days" }),
    defineField({ name: "quantityAvailable", title: "Quantity available", type: "number", validation: (rule) => rule.integer().min(0) }),
    defineField({ name: "specification", title: "Key specification", type: "text", rows: 3 }),
    defineField({
      name: "image", title: "Main gallery image", type: "image", options: { hotspot: true },
      validation: (rule) => rule.required().error("Add a main image before publishing this vehicle."),
      description: "The first and primary image shown for this vehicle on the stock page.",
      fields: [defineField({ name: "alt", title: "Image description", type: "string", validation: (rule) => rule.required() })],
    }),
    defineField({
      name: "gallery", title: "Additional vehicle gallery images", type: "array",
      description: "Add vehicle photographs in the order they should appear. Do not upload manufacturer or warranty logos here.",
      options: { layout: "grid" },
      of: [{ type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Image description", type: "string", validation: (rule) => rule.required() })] }],
    }),
    defineField({
      name: "logo", title: "Vehicle or manufacturer logo", type: "image",
      description: "Optional. Displayed above the stock number; keep logos out of the vehicle gallery.",
      fields: [defineField({ name: "alt", title: "Logo description", type: "string", validation: (rule) => rule.required() })],
    }),
    defineField({ name: "sortOrder", title: "Display order", type: "number", initialValue: 100 }),
    defineField({ name: "published", title: "Show on website", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { make: "make", model: "model", status: "status", media: "image" },
    prepare: ({ make, model, status, media }) => ({ title: `${make || ""} ${model || ""}`.trim(), subtitle: status, media }),
  },
});
