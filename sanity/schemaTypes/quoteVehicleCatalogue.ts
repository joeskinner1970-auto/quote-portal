import { defineField, defineType } from "sanity";

export const quoteVehicleCatalogue=defineType({name:"quoteVehicleCatalogue",title:"Quote vehicle catalogue settings",type:"document",fields:[defineField({name:"portalEnvironment",type:"string",readOnly:true,hidden:true}),defineField({name:"initialised",title:"Shared catalogue initialised",type:"boolean",readOnly:true}),defineField({name:"recordCount",title:"Imported records",type:"number",readOnly:true}),defineField({name:"updatedAt",title:"Last imported",type:"datetime",readOnly:true}),defineField({name:"updatedBy",title:"Imported by",type:"string",readOnly:true})]});

