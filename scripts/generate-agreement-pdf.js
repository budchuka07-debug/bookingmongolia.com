/**
 * Generates a minimal PDF for BookingMongolia General Travel Agreement (v2026).
 * Run: node scripts/generate-agreement-pdf.js
 */
const fs = require("fs");
const path = require("path");

function escapePdf(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const lines = [
  "Booking Mongolia — General Travel Agreement",
  "Version 2026",
  "",
  "This General Travel Agreement applies to all bookings made through",
  "Booking Mongolia (bookingmongolia.com).",
  "",
  "1. Parties",
  "Operator: Booking Mongolia",
  "Guest: the traveler who submits a booking request and accepts this agreement.",
  "",
  "2. Nature of this Agreement",
  "This is a GENERAL agreement. Traveler-specific details such as exact tour",
  "dates, itinerary, price, inclusions, exclusions and booking references are",
  "confirmed separately in the individual booking confirmation.",
  "",
  "3. Booking Process",
  "- Guest submits a booking or travel request.",
  "- Operator confirms dates, itinerary and availability.",
  "- Payment instructions are sent after confirmation.",
  "- Payments currently accepted: Wise transfer and SWIFT bank transfer.",
  "",
  "4. Services",
  "Operator arranges agreed local services such as private tours, drivers,",
  "vehicles, guides and selected accommodations through Booking Mongolia and",
  "partner providers, subject to availability.",
  "",
  "5. Changes and Flexibility",
  "Date changes requested 7 or more days before start can usually be processed",
  "without an extra change fee, subject to availability. Changes requested less",
  "than 7 days before start may require an additional charge. Mongolia weather",
  "and road conditions may require safe itinerary adjustments.",
  "",
  "6. Guest Responsibilities",
  "Guest is responsible for passport/visa validity and travel insurance.",
  "",
  "7. Limitation",
  "Third-party hotels, ger camps and activity providers remain responsible for",
  "their own service quality under their own terms.",
  "",
  "8. Acceptance",
  "By checking the acceptance box on the Booking Mongolia booking form, the",
  "Guest confirms they have read and agree to this General Travel Agreement.",
  "",
  "Contact: WhatsApp +976 90283039",
  "Email: hello@discovermongoliatours.com",
  "Web: https://bookingmongolia.com"
];

let y = 800;
const content = ["BT", "/F1 11 Tf"];
lines.forEach((line, i) => {
  if (i === 0) content.push("/F1 16 Tf");
  if (i === 1) content.push("/F1 12 Tf");
  if (i === 2) content.push("/F1 10 Tf");
  content.push(`1 0 0 1 50 ${y} Tm`, `(${escapePdf(line)}) Tj`);
  y -= i === 0 ? 22 : 14;
});
content.push("ET");
const stream = content.join("\n");

const objs = [
  "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
  "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
  "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n",
  `4 0 obj<< /Length ${Buffer.byteLength(stream, "utf8")} >>stream\n${stream}\nendstream\nendobj\n`,
  "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n"
];

let pdf = "%PDF-1.4\n";
const offsets = [0];
objs.forEach((o) => {
  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += o;
});
const xref = Buffer.byteLength(pdf, "utf8");
pdf += `xref\n0 ${objs.length + 1}\n`;
pdf += "0000000000 65535 f \n";
for (let i = 1; i < offsets.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

const root = path.join(__dirname, "..");
const targets = [
  path.join(root, "documents", "BookingMongolia-General-Travel-Agreement.pdf"),
  path.join(root, "public", "documents", "BookingMongolia-General-Travel-Agreement.pdf")
];

targets.forEach((file) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pdf);
  console.log("Wrote", file, fs.statSync(file).size, "bytes");
});
