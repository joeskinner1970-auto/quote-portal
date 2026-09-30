import { defineField, defineType } from "sanity";

export const leasingOffer = defineType({
  name:"leasingOffer", title:"Leasing Offer", type:"document",
  fields:[
    defineField({name:"make",title:"Manufacturer",type:"string",validation:r=>r.required()}),
    defineField({name:"model",title:"Model",type:"string",validation:r=>r.required()}),
    defineField({name:"derivative",title:"Derivative",type:"string",validation:r=>r.required()}),
    defineField({name:"slug",title:"Slug",type:"slug",options:{source:(doc)=>[doc.make,doc.model,doc.derivative].filter(Boolean).join(" ")},validation:r=>r.required()}),
    defineField({name:"financeType",title:"Finance type",type:"string",options:{list:["Business Contract Hire","Finance Lease"]},validation:r=>r.required()}),
    defineField({name:"monthlyRental",title:"Monthly rental ex VAT (£)",type:"number",validation:r=>r.required().positive()}),
    defineField({name:"initialRental",title:"Initial rental ex VAT (£)",type:"number",validation:r=>r.required().positive()}),
    defineField({name:"initialRentalMonths",title:"Initial rental (months)",type:"number",validation:r=>r.required().integer().positive()}),
    defineField({name:"termMonths",title:"Total term (months)",type:"number",validation:r=>r.required().integer().positive()}),
    defineField({name:"annualMileage",title:"Annual mileage",type:"number",validation:r=>r.required().integer().positive()}),
    defineField({name:"finalPayment",title:"Final payment ex VAT (£)",type:"number",validation:r=>r.min(0)}),
    defineField({name:"maintenance",title:"Maintenance",type:"string",options:{list:["Customer maintained","Funder maintained"]},validation:r=>r.required()}),
    defineField({name:"funder",title:"Funder",type:"string",validation:r=>r.required()}),
    defineField({name:"status",title:"Availability",type:"string",options:{list:["In stock","Factory order","Limited availability"]}}),
    defineField({name:"bodyType",title:"Body type",type:"string"}),defineField({name:"engine",title:"Engine",type:"string"}),defineField({name:"fuelType",title:"Fuel type",type:"string"}),defineField({name:"transmission",title:"Transmission",type:"string"}),defineField({name:"driveType",title:"Drive type",type:"string"}),
    defineField({name:"specification",title:"Specification",type:"text",rows:4}),
    defineField({name:"image",title:"Main image",type:"image",options:{hotspot:true},fields:[defineField({name:"alt",title:"Image description",type:"string",validation:r=>r.required()})]}),
    defineField({name:"disclosure",title:"Offer finance disclosure",type:"text",rows:8,description:"Must accurately reflect this offer's term, mileage, payment profile, maintenance and funder."}),
    defineField({name:"sortOrder",title:"Display order",type:"number",initialValue:100}),
    defineField({name:"published",title:"Show on website",type:"boolean",initialValue:false})
  ],
  preview:{select:{make:"make",model:"model",derivative:"derivative",media:"image"},prepare:({make,model,derivative,media})=>({title:`${make||""} ${model||""}`.trim(),subtitle:derivative,media})}
});
