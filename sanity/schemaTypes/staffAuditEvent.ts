import { defineField, defineType } from "sanity";

export const staffAuditEvent=defineType({name:"staffAuditEvent",title:"Staff audit events",type:"document",readOnly:true,fields:[
 defineField({name:"portalEnvironment",type:"string",hidden:true}),defineField({name:"occurredAt",title:"Time",type:"datetime"}),defineField({name:"action",title:"Action",type:"string"}),
 defineField({name:"entityType",title:"Record type",type:"string"}),defineField({name:"entityId",title:"Record ID",type:"string"}),defineField({name:"summary",title:"Summary",type:"string"}),
 defineField({name:"actorName",title:"Performed by",type:"string"}),defineField({name:"actorEmail",title:"Email",type:"string"}),defineField({name:"before",title:"Before",type:"text"}),defineField({name:"after",title:"After",type:"text"}),
],preview:{select:{title:"summary",date:"occurredAt",actor:"actorName"},prepare:({title,date,actor})=>({title,subtitle:`${date?new Date(date).toLocaleString("en-GB"):""}${actor?` by ${actor}`:""}`})}});

