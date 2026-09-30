import { defineField, defineType } from "sanity";
export const leasingQuote=defineType({name:"leasingQuote",title:"Leasing Quote Request",type:"document",fields:[
defineField({name:"submittedAt",title:"Submitted",type:"datetime",readOnly:true}),defineField({name:"status",title:"Status",type:"string",initialValue:"New",options:{list:["New","Contacted","Quoted","Won","Lost","Closed"]}}),
...["firstName","lastName","company","phone","email","make","model","specification","term","initialRental","annualMileage","maintenance"].map(name=>defineField({name,title:name.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()),type:name==="annualMileage"?"number":"string"})),
defineField({name:"message",title:"Additional information",type:"text"}),defineField({name:"consent",title:"Consent provided",type:"boolean",readOnly:true})
],preview:{select:{firstName:"firstName",lastName:"lastName",company:"company",model:"model",submittedAt:"submittedAt"},prepare:({firstName,lastName,company,model,submittedAt})=>({title:`${firstName||""} ${lastName||""}`.trim(),subtitle:[company,model,submittedAt&&new Date(submittedAt).toLocaleString("en-GB")].filter(Boolean).join(" · ")})}});
