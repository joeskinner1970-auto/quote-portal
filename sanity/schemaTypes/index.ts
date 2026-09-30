import { article } from "./article";
import { stockVehicle } from "./stockVehicle";
import { vehicleEnquiry } from "./vehicleEnquiry";
import { generalEnquiry } from "./generalEnquiry";
import { review } from "./review";
import { financeProposal } from "./financeProposal";
import { ilesbusArticle } from "./ilesbusArticle";
import { ilesbusEnquiry } from "./ilesbusEnquiry";
import { ilesbusNewsletterSignup } from "./ilesbusNewsletterSignup";
import { leasingOffer } from "./leasingOffer";
import { leasingQuote } from "./leasingQuote";
import { staffLoginCode } from "./staffLoginCode";
import { staffUser } from "./staffUser";
import { salesQuote } from "./salesQuote";
import { salesQuoteCounter } from "./salesQuoteCounter";
import { quoteVehicle } from "./quoteVehicle";
import { quoteVehicleCatalogue } from "./quoteVehicleCatalogue";
import { quoteVehicleImport } from "./quoteVehicleImport";
import { staffAuditEvent } from "./staffAuditEvent";
import { siteSettings } from "./siteSettings";

export const automotivateSchemaTypes = [
  article,
  stockVehicle,
  vehicleEnquiry,
  generalEnquiry,
  review,
  financeProposal,
  leasingOffer,
  leasingQuote,
  siteSettings,
  staffUser,
  staffLoginCode,
  salesQuote,
  salesQuoteCounter,
  quoteVehicle,
  quoteVehicleCatalogue,
  quoteVehicleImport,
  staffAuditEvent,
];

export const ilesbusSchemaTypes = [
  ilesbusArticle,
  ilesbusEnquiry,
  ilesbusNewsletterSignup,
];
