import "server-only";
import { randomUUID } from "node:crypto";
import { staffDataEnvironment } from "./staffSanity";

export type StaffAuditInput={action:string;entityType:"quote"|"vehicle"|"catalogue"|"user";entityId:string;summary:string;actorName:string;actorEmail:string;before?:unknown;after?:unknown};

const serialise=(value:unknown)=>value===undefined?undefined:JSON.stringify(value).slice(0,10000);

export function staffAuditDocument(input:StaffAuditInput){
 return{_id:`staffAuditEvent-${staffDataEnvironment}-${randomUUID()}`,_type:"staffAuditEvent",portalEnvironment:staffDataEnvironment,occurredAt:new Date().toISOString(),action:input.action,entityType:input.entityType,entityId:input.entityId,summary:input.summary,actorName:input.actorName,actorEmail:input.actorEmail,...(input.before===undefined?{}:{before:serialise(input.before)}),...(input.after===undefined?{}:{after:serialise(input.after)})};
}

