export type QuoteLine = { description: string; price: number; costPrice?: number };

export type QuoteInput = {
  quoteType: "sales" | "leasing" | "finance-lease" | "asset-finance"; sourceOfRecord: string; assetDetails: string; funder: string; financeCommission: number; p11d: number; co2: number; termMonths: number; paymentProfileInitial: number; paymentProfileMonthly: number; annualMileage: number; maintenance: "included" | "excluded"; financeInitialRental: number; serviceInitialRental: number; financeMonthlyRental: number; serviceMonthlyRental: number; financeExcessMileage: number; serviceExcessMileage: number; vehicleSystemPrice: number; funderCommission: number; customerAdminFee: number; fleetAllianceFee: number; finalBalloonPayment: number;
  quoteDate: string; validUntil: string;
  customerCompany: string; customerContact: string; address1: string; address2: string; town: string; postcode: string; customerEmail: string; customerTelephone: string;
  quantity: number; vehicleMake: string; vehicleModel: string; vehicleVariant: string; modelYear: string; transmission: string; bodyType: string; colour: string;
  basicListPrice: number; priceOverride: number | null; factoryOptions: QuoteLine[]; dealerOptions: QuoteLine[];
  dealerDiscountPct: number; dealerMarginPct: number; dealerMarginOverride: number | null; dealerDiscountRetained: number;
  commissionMode: "flat" | "percentage"; commission: number; commissionPct: number; manufacturerTerms: number; evGrant: number;
  delivery: number; onwardDelivery: number; vatPct: number; rfl: number; firstRegistrationFee: number; internalNotes: string;
};

export const calculationVersion = "automotivate-otr-v2";

const amount = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function nextQuoteNumber(highestSaved: number | null, counterNext: number | null) {
  return Math.max(28000, (Number(highestSaved) || 27999) + 1, Number(counterNext) || 28000);
}

export function calculateQuote(input: QuoteInput) {
  const listPrice = input.priceOverride !== null ? amount(input.priceOverride) : amount(input.basicListPrice);
  const factoryOptionsTotal = input.factoryOptions.reduce((sum, line) => sum + amount(line.price), 0);
  const subtotal = listPrice + factoryOptionsTotal;
  const dealerDiscount = subtotal * amount(input.dealerDiscountPct) / 100;
  const dealerMargin = subtotal * amount(input.dealerMarginPct) / 100;
  const manualDealerDiscount = input.dealerMarginOverride === null ? 0 : amount(input.dealerMarginOverride);
  const commission = input.commissionMode === "percentage" ? subtotal * amount(input.commissionPct) / 100 : amount(input.commission);
  const dealerDiscountToShow = dealerDiscount - dealerMargin + manualDealerDiscount - amount(input.dealerDiscountRetained) - commission;
  const terms = subtotal * amount(input.manufacturerTerms) / 100;
  const totalDiscount = dealerDiscountToShow + terms;
  const dealerOptionsTotal = input.dealerOptions.reduce((sum, line) => sum + amount(line.price), 0);
  const totalBeforeVat = subtotal - totalDiscount + dealerOptionsTotal + amount(input.delivery) + amount(input.onwardDelivery);
  const vat = totalBeforeVat * amount(input.vatPct) / 100;
  const totalDue = totalBeforeVat + vat + amount(input.rfl) + amount(input.firstRegistrationFee) - amount(input.evGrant);
  return { listPrice, factoryOptionsTotal, subtotal, dealerDiscount, dealerMargin, commission, dealerDiscountToShow, terms, totalDiscount, dealerOptionsTotal, totalBeforeVat, vat, totalDue, orderTotal: totalDue * Math.max(1, Math.floor(amount(input.quantity))) };
}

export function sanitiseQuote(value: Record<string, unknown>): QuoteInput {
  const text = (key: string, limit = 500) => String(value[key] || "").trim().slice(0, limit);
  const number = (key: string) => amount(value[key]);
  const lines = (key: string, includeCost = false): QuoteLine[] => Array.isArray(value[key]) ? (value[key] as Record<string, unknown>[]).slice(0, 30).map((line) => ({ description: String(line.description || "").trim().slice(0, 500), price: amount(line.price), ...(includeCost ? { costPrice: amount(line.costPrice) } : {}) })).filter((line) => line.description) : [];
  const override = value.dealerMarginOverride;
  return {
    quoteType: value.quoteType === "leasing" ? "leasing" : value.quoteType === "finance-lease" ? "finance-lease" : value.quoteType === "asset-finance" ? "asset-finance" : "sales", sourceOfRecord: text("sourceOfRecord", 100), assetDetails: text("assetDetails", 5000), funder: text("funder", 200), financeCommission: number("financeCommission"), p11d: number("p11d"), co2: number("co2"), termMonths: Math.max(0, Math.floor(number("termMonths"))), paymentProfileInitial: Math.max(0, Math.floor(number("paymentProfileInitial"))), paymentProfileMonthly: Math.max(0, Math.floor(number("paymentProfileMonthly"))), annualMileage: Math.max(0, Math.floor(number("annualMileage"))), maintenance: value.maintenance === "included" ? "included" : "excluded", financeInitialRental: number("financeInitialRental"), serviceInitialRental: number("serviceInitialRental"), financeMonthlyRental: number("financeMonthlyRental"), serviceMonthlyRental: number("serviceMonthlyRental"), financeExcessMileage: number("financeExcessMileage"), serviceExcessMileage: number("serviceExcessMileage"), vehicleSystemPrice: number("vehicleSystemPrice"), funderCommission: number("funderCommission"), customerAdminFee: number("customerAdminFee"), fleetAllianceFee: number("fleetAllianceFee"), finalBalloonPayment: number("finalBalloonPayment"), quoteDate: text("quoteDate", 10), validUntil: text("validUntil", 10), customerCompany: text("customerCompany", 200), customerContact: text("customerContact", 200), address1: text("address1", 300), address2: text("address2", 300), town: text("town", 200), postcode: text("postcode", 20), customerEmail: text("customerEmail", 320), customerTelephone: text("customerTelephone", 100), quantity: Math.max(1, Math.min(1000, Math.floor(number("quantity")))), vehicleMake: text("vehicleMake", 100), vehicleModel: text("vehicleModel", 500), vehicleVariant: text("vehicleVariant", 500), modelYear: text("modelYear", 40), transmission: text("transmission", 100), bodyType: text("bodyType", 100), colour: text("colour", 100), basicListPrice: number("basicListPrice"), priceOverride: value.priceOverride === "" || value.priceOverride === null || value.priceOverride === undefined ? null : number("priceOverride"), factoryOptions: lines("factoryOptions"), dealerOptions: lines("dealerOptions", true), dealerDiscountPct: number("dealerDiscountPct"), dealerMarginPct: number("dealerMarginPct"), dealerMarginOverride: override === "" || value.dealerMarginOverride === null || value.dealerMarginOverride === undefined ? null : amount(override), dealerDiscountRetained: number("dealerDiscountRetained"), commissionMode: value.commissionMode === "percentage" ? "percentage" : "flat", commission: number("commission"), commissionPct: number("commissionPct"), manufacturerTerms: number("manufacturerTerms"), evGrant: number("evGrant"), delivery: number("delivery"), onwardDelivery: number("onwardDelivery"), vatPct: number("vatPct"), rfl: number("rfl"), firstRegistrationFee: number("firstRegistrationFee"), internalNotes: text("internalNotes", 5000),
  };
}

export function validateQuote(input: QuoteInput) {
  if (!input.customerCompany || !input.customerContact || !input.customerEmail || (input.quoteType !== "asset-finance" && (!input.vehicleMake || !input.vehicleModel))) return "Complete the customer and vehicle details.";
  if (!/^\S+@\S+\.\S+$/.test(input.customerEmail)) return "Enter a valid customer email address.";
  if (input.quoteType === "leasing" || input.quoteType === "finance-lease" || input.quoteType === "asset-finance") return null;
  if ((input.priceOverride ?? input.basicListPrice) < 0) return "Enter a basic list price or manual price override of zero or more.";
  if (input.manufacturerTerms < 0 || input.manufacturerTerms > 100) return "Enter manufacturer terms as a percentage between 0 and 100.";
  if (input.vatPct < 0 || input.vatPct > 100) return "Enter a valid VAT percentage.";
  return null;
}
