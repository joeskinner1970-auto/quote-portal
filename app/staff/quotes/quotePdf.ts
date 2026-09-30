import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { calculateQuote, QuoteInput } from "./quote";
import { salesTermsPdfText } from "../../lib/salesTerms";
import { leasingTerms } from "../../lib/leasingTerms";

const A4: [number, number] = [595.28, 841.89];
const blue = rgb(42 / 255, 136 / 255, 236 / 255);
const darkBlue = rgb(30 / 255, 111 / 255, 199 / 255);
const border = rgb(175 / 255, 199 / 255, 232 / 255);
const ink = rgb(20 / 255, 20 / 255, 20 / 255);
const grey = rgb(102 / 255, 102 / 255, 102 / 255);
const paleBlue = rgb(238 / 255, 244 / 255, 252 / 255);

const safe = (value: unknown) => String(value || "-").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2010-\u2015]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[^\x20-\x7e£]/g, "");
const money = (value: number) => `£${(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string) => { const parsed = new Date(`${value}T00:00:00Z`); return Number.isNaN(parsed.valueOf()) ? safe(value) : parsed.toLocaleDateString("en-GB", { timeZone: "UTC" }); };

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = safe(text).split(/\s+/); const lines: string[] = []; let line = "";
  for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate; else { if (line) lines.push(line); line = word; } }
  if (line) lines.push(line); return lines.length ? lines : [""];
}

export async function createQuotePdf(input: QuoteInput, options: { quoteNumber?: number; quoteReference?: string; salesperson: string; salesEmail: string; draft?: boolean; isOrder?: boolean }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const isLeasing = input.quoteType === "leasing" || input.quoteType === "finance-lease";
  const quoteTitle = options.isOrder ? "Sales Order" : input.quoteType === "finance-lease" ? "Finance Lease Quotation" : input.quoteType === "leasing" ? "Leasing Quotation" : input.quoteType === "asset-finance" ? "Asset Finance Quotation" : "Sales Quotation";
  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | undefined;
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", isLeasing ? "automotivate-leasing-logo.png" : "automotivate-logo.png"));
    logo = await pdf.embedPng(logoBytes);
  } catch (error) {
    console.error("[staff-quotes:pdf-logo]", error);
  }
  const totals = calculateQuote(input);
  let page = pdf.addPage(A4), y = 806;
  const left = 40, width = A4[0] - 80;

  const addPage = () => { page = pdf.addPage(A4); y = 802; return page; };
  const ensure = (height: number) => { if (y - height < 48) addPage(); };
  const text = (value: string, x: number, yy: number, size = 9, font = regular, colour = ink) => page.drawText(safe(value), { x, y: yy, size, font, color: colour });
  const line = (yy: number, thickness = 1, colour = border) => page.drawLine({ start: { x: left, y: yy }, end: { x: left + width, y: yy }, thickness, color: colour });
  const formRow = (label: string, value: string) => {
    const labelWidth = 124, valueLines = wrap(value || "-", regular, 9, width - labelWidth - 16), height = Math.max(23, valueLines.length * 11 + 10); ensure(height);
    page.drawRectangle({ x: left, y: y - height, width: labelWidth, height, color: blue, borderColor: border, borderWidth: .6 });
    page.drawRectangle({ x: left + labelWidth, y: y - height, width: width - labelWidth, height, color: rgb(1,1,1), borderColor: border, borderWidth: .6 });
    text(label, left + 8, y - 15, 9, bold, rgb(1,1,1));
    valueLines.forEach((part, index) => text(part, left + labelWidth + 8, y - 15 - index * 11)); y -= height;
  };
  const moneyRow = (label: string, amount: number, kind: "normal"|"subtotal"|"total"|"order" = "normal", suffix = "") => {
    const size = kind === "total" ? 11 : 9, font = kind === "normal" ? regular : bold, labelLines = wrap(label, font, size, width - 158), height = Math.max(kind === "total" ? 27 : 23, labelLines.length * 11 + 10);
    ensure(height); const fill = kind === "total" ? blue : kind === "subtotal" ? paleBlue : kind === "order" ? rgb(.96,.95,.93) : rgb(1,1,1), colour = kind === "total" ? rgb(1,1,1) : kind === "order" ? darkBlue : ink;
    page.drawRectangle({ x: left, y: y-height, width, height, color: fill, borderColor: kind === "total" ? blue : border, borderWidth: .6 });
    labelLines.forEach((part, index) => text(part, left + 8, y - 15 - index * 11, size, font, colour));
    const amountText = `${money(amount)}${suffix}`; text(amountText, left + width - 8 - font.widthOfTextAtSize(amountText, size), y - height / 2 - size / 3, size, font, colour); y -= height;
  };
  const leaseRow = (cells: string[], heading = false) => { const height = 23, colWidth = width / 4; ensure(height); cells.forEach((cell, index) => { const fill = heading ? blue : rgb(1,1,1), colour = heading ? rgb(1,1,1) : ink; page.drawRectangle({ x: left + index * colWidth, y: y - height, width: colWidth, height, color: fill, borderColor: border, borderWidth: .6 }); const size = 8; text(cell, left + index * colWidth + 6, y - height + 8, size, heading ? bold : index === 0 ? bold : regular, colour); }); y -= height; };

  const logoHeight = logo ? logo.scaleToFit(isLeasing ? 180 : 165, isLeasing ? 50 : 34).height : 0; if (logo) { const scaled = logo.scaleToFit(isLeasing ? 180 : 165, isLeasing ? 50 : 34); page.drawImage(logo, { x:left, y:y-scaled.height+2, width:scaled.width, height:scaled.height }); } const contact=["F17, Building 330, Street 1, Westcott Venture Park, HP18 0NP","Telephone: 01865 20 30 40",`E-mail: ${options.salesEmail}`]; contact.forEach((part,index)=>text(part,left,y-logoHeight-7-index*10,8,regular,grey));
  const meta = [options.draft ? "DRAFT - NOT SAVED" : `Quote Number: ${options.quoteReference || options.quoteNumber}`, `Date: ${date(input.quoteDate)}`, `Valid Until: ${date(input.validUntil)}`, `Quotation by: ${options.salesperson}`];
  meta.forEach((part,index)=>{ const font=index===0?bold:regular, colour=index===0?darkBlue:ink; text(part,left+width-font.widthOfTextAtSize(part,index===0?10:8.5),y-index*13,index===0?10:8.5,font,colour); });
  y-=isLeasing ? 94 : 78; line(y,2.3,blue); y-=25; text(quoteTitle,left,y,18,bold,darkBlue); y-=18;

  formRow("Company:", input.customerCompany); formRow("Address:", [input.address1,input.address2,input.town].filter(Boolean).join(", ")); formRow("Postcode:",input.postcode); formRow("Contact:",input.customerContact); formRow("Email:",input.customerEmail); formRow("Tel No:",input.customerTelephone); formRow("No. Required:",String(input.quantity)); y-=12;
  if (input.quoteType === "asset-finance") {
    formRow("Asset details:", input.assetDetails); formRow("Funder:", input.funder); moneyRow("FINANCE COMMISSION", input.financeCommission, "total");
  } else {
  formRow("Make:",input.vehicleMake); formRow("Model:",input.vehicleModel); formRow("Variant:",input.vehicleVariant); formRow("Model year:",input.modelYear); formRow("Transmission:",input.transmission); formRow("Body type:",input.bodyType); formRow("CO2:",`${input.co2} g/km`); formRow("P11D:",money(input.p11d)); formRow("Colour:",input.colour);
  if (isLeasing) {
    y -= 12;
    const section = (title: string) => { ensure(25); page.drawRectangle({ x: left, y: y - 25, width, height: 25, color: blue, borderColor: blue, borderWidth: .6 }); text(title, left + 8, y - 17, 10, bold, rgb(1,1,1)); y -= 25; };
    section("Factory options"); if (input.factoryOptions.length) input.factoryOptions.forEach(option => formRow("Option:", option.description)); else formRow("Option:", "None");
    section("Dealer fit options"); if (input.dealerOptions.length) input.dealerOptions.forEach(option => formRow("Option:", option.description)); else formRow("Option:", "None");
    addPage();
    section("Contract details");
    leaseRow(["", "Initial rental", "Monthly rental", "Excess mileage"], true);
    const initialFinance = input.financeMonthlyRental * input.paymentProfileInitial, initialService = input.serviceMonthlyRental * input.paymentProfileInitial, initialTotal = initialFinance + initialService, monthlyTotal = input.financeMonthlyRental + input.serviceMonthlyRental, ppm = (value: number) => `${(value || 0).toFixed(2)} ppm`;
    leaseRow(["Finance", money(initialFinance), money(input.financeMonthlyRental), ppm(input.financeExcessMileage)]);
    leaseRow(["Service", money(initialService), money(input.serviceMonthlyRental), ppm(input.serviceExcessMileage)]);
    leaseRow(["Total", money(initialTotal), money(monthlyTotal), ppm(input.financeExcessMileage + input.serviceExcessMileage)]);
    formRow("Term:", `${input.termMonths} months`); formRow("Payment profile:", `${input.paymentProfileInitial} + ${input.paymentProfileMonthly}`); formRow("Annual mileage:", input.annualMileage.toLocaleString("en-GB")); formRow("Maintenance:", input.maintenance === "included" ? "Included" : "Not included"); y -= 12;
    moneyRow("TOTAL INITIAL RENTAL", initialTotal, "total", " + VAT"); moneyRow("TOTAL MONTHLY RENTAL", monthlyTotal, "total", " + VAT"); if (input.quoteType === "finance-lease") moneyRow("FINAL BALLOON PAYMENT", input.finalBalloonPayment, "total", " + VAT");
    addPage();
    section("Terms & Conditions");
    leasingTerms.forEach((term) => {
      const lines = wrap(term, regular, 8, width - 16), height = lines.length * 10 + 10;
      ensure(height);
      lines.forEach((part, index) => text(part, left + 8, y - 10 - index * 10, 8, index === 0 ? bold : regular, grey));
      y -= height;
    });
  } else {
    y-=14; moneyRow("Basic list price",totals.listPrice); input.factoryOptions.forEach(option=>moneyRow(option.description || "Factory option",option.price)); moneyRow("Sub-total",totals.subtotal,"subtotal"); moneyRow("Less: total discount",-totals.totalDiscount); moneyRow("Sub-total",totals.subtotal-totals.totalDiscount,"subtotal"); input.dealerOptions.forEach(option=>moneyRow(option.description || "Dealer fit option",option.price)); moneyRow("PDI & Delivery",input.delivery); moneyRow("Onward Delivery",input.onwardDelivery); moneyRow("Sub-total",totals.totalBeforeVat,"subtotal"); moneyRow("VAT",totals.vat); moneyRow("RFL",input.rfl); moneyRow("First reg fee",input.firstRegistrationFee); moneyRow("EV Grant",-input.evGrant); moneyRow("Total per vehicle",totals.totalDue); moneyRow("TOTAL DUE",totals.orderTotal,"total"); if(options.isOrder){ensure(86);y-=18;text("I hereby confirm my acceptance to proceed with the vehicle order.",left,y,9,regular,ink);y-=62;page.drawRectangle({x:left,y,width,height:48,borderColor:border,borderWidth:.8,borderDashArray:[4,3]});y-=10;}
  }
  }

  const leasingLegal = "Automotivate Leasing Limited · Registered in England No. 16683839 · VAT No. 501552336 · Registered office: Montgomery House, Sheephouse Wood, Stocksbridge, Sheffield, S36 4GS. FCA Reference Number 1043065. Automotivate Leasing Limited is an independent credit broker, not a lender, and may receive commission for introducing you to a funder. Automotivate Leasing Limited is an Appointed Representative of Fleet Alliance Limited. Fleet Alliance Limited is authorised and regulated by the Financial Conduct Authority (reference 673150). Not all types of business undertaken are authorised and regulated by the Financial Conduct Authority. Fleet Alliance Limited · Registered in Scotland No. SC235634 · Registered address: Skypark 1, 8 Elliot Place, Glasgow, G3 8EP. Fleet Alliance Limited is an independent credit broker, not a lender, and may receive commission for introducing you to a funder. See its Terms of Business: https://www.fleetalliance.co.uk/legal-information/.";
  const terms = isLeasing ? leasingLegal : input.quoteType === "sales" ? `Terms & Conditions. ${salesTermsPdfText}` : "Automotivate Fleet Solutions Ltd · Registered in England No. 16707642 · Registered office: Montgomery House, Sheephouse Wood, Stocksbridge, Sheffield, S36 4GS.";
  const termLines=wrap(terms,regular,6.8,width), termHeight=termLines.length*9+18; ensure(termHeight); y-=16; line(y,2.3,blue); y-=17; termLines.forEach((part,index)=>text(part,left,y-index*9,6.8,index===0?bold:regular,grey));
  const pages=pdf.getPages(); pages.forEach((item,index)=>{const label=`Page ${index+1} of ${pages.length}`;item.drawText(label,{x:A4[0]-40-regular.widthOfTextAtSize(label,7),y:23,size:7,font:regular,color:grey});});
  pdf.setTitle(`${options.draft ? "Draft" : `Quote ${options.quoteReference || options.quoteNumber}`} - ${input.customerCompany}`); pdf.setAuthor("Automotivate Fleet Solutions Ltd"); pdf.setCreator("Automotivate quote portal");
  return pdf.save();
}

export async function createFallbackQuotePdf(input: QuoteInput, options: { quoteNumber?: number; quoteReference?: string; salesperson: string; salesEmail: string; draft?: boolean; isOrder?: boolean }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage(A4), left = 40, width = A4[0] - 80;
  let y = 800;
  const draw = (value: unknown, size = 10, font = regular) => { const lines = wrap(String(value), font, size, width); for (const part of lines) { if (y < 48) break; page.drawText(part, { x: left, y, size, font, color: ink }); y -= size + 5; } };
  const title = options.isOrder ? "Sales Order" : input.quoteType === "finance-lease" ? "Finance Lease Quotation" : input.quoteType === "leasing" ? "Leasing Quotation" : input.quoteType === "asset-finance" ? "Asset Finance Quotation" : "Sales Quotation";
  draw(title, 18, bold); y -= 10;
  draw(options.draft ? "DRAFT - NOT SAVED" : `Quote Number: ${options.quoteReference || options.quoteNumber}`, 11, bold);
  draw(`Date: ${date(input.quoteDate)}`); draw(`Customer: ${input.customerCompany}`); draw(`Contact: ${input.customerContact}`); draw(`Email: ${input.customerEmail}`); y -= 8;
  if (input.quoteType === "asset-finance") { draw(`Asset details: ${input.assetDetails}`); draw(`Finance commission: ${money(input.financeCommission)}`, 11, bold); }
  else if (input.quoteType === "leasing" || input.quoteType === "finance-lease") { const initial=(input.financeMonthlyRental + input.serviceMonthlyRental) * input.paymentProfileInitial, monthly=input.financeMonthlyRental + input.serviceMonthlyRental; draw(`Vehicle: ${input.vehicleMake} ${input.vehicleModel} ${input.vehicleVariant}`); draw(`Term: ${input.termMonths} months`); draw(`Total initial rental: ${money(initial)} + VAT`, 11, bold); draw(`Total monthly rental: ${money(monthly)} + VAT`, 11, bold); if (input.quoteType === "finance-lease") draw(`Final balloon payment: ${money(input.finalBalloonPayment)} + VAT`, 11, bold); }
  else { const totals = calculateQuote(input); draw(`Vehicle: ${input.vehicleMake} ${input.vehicleModel} ${input.vehicleVariant}`); draw(`Basic list price: ${money(totals.listPrice)}`); draw(`TOTAL DUE: ${money(totals.orderTotal)}`, 12, bold); }
  draw(`Quotation by: ${options.salesperson}`); draw(`E-mail: ${options.salesEmail}`);
  return pdf.save();
}