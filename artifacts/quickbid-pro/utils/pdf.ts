import { BusinessProfile, Customer, Estimate, Invoice, LineItem } from "@/types/models";
import { calcSubtotal, calcDiscount, calcTotal, formatCurrency, formatDate } from "./calculations";

export function buildEstimatePdfHtml(
  estimate: Estimate,
  customer: Customer,
  profile: BusinessProfile
): string {
  const subtotal = calcSubtotal(estimate.lineItems);
  const discountAmt = calcDiscount(subtotal, estimate.discount, estimate.discountType);
  const total = calcTotal(estimate.lineItems, estimate.discount, estimate.discountType);
  const sym = profile.currencySymbol || "$";

  const lineItemsHtml = estimate.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#0f172a;">${escHtml(item.title)}</div>
          ${item.description ? `<div style="color:#64748b;font-size:13px;">${escHtml(item.description)}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;color:#64748b;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;color:#64748b;">${formatCurrency(item.unitPrice, sym)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#0f172a;">${formatCurrency(item.quantity * item.unitPrice, sym)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; margin:0; padding:0; color:#0f172a; background:#fff; }
  .page { max-width:680px; margin:0 auto; padding:48px 40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
  .biz-name { font-size:24px; font-weight:700; color:#0f172a; }
  .biz-info { font-size:13px; color:#64748b; margin-top:4px; line-height:1.6; }
  .doc-title { text-align:right; }
  .doc-type { font-size:32px; font-weight:700; color:#1a56db; letter-spacing:-1px; }
  .doc-num { font-size:14px; color:#64748b; margin-top:4px; }
  .divider { border:none; border-top:2px solid #e2e8f0; margin:24px 0; }
  .parties { display:flex; justify-content:space-between; margin-bottom:32px; }
  .party-block { }
  .party-label { font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
  .party-name { font-size:15px; font-weight:600; color:#0f172a; }
  .party-detail { font-size:13px; color:#64748b; line-height:1.6; }
  .meta { display:flex; gap:40px; margin-bottom:32px; }
  .meta-item { }
  .meta-label { font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
  .meta-value { font-size:14px; color:#0f172a; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  th { text-align:left; padding-bottom:10px; border-bottom:2px solid #e2e8f0; font-size:12px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; }
  th.right { text-align:right; }
  th.center { text-align:center; }
  .totals { margin-left:auto; width:260px; }
  .total-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
  .total-row.grand { border-top:2px solid #0f172a; margin-top:8px; padding-top:12px; font-size:18px; font-weight:700; }
  .section-title { font-size:12px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
  .section-text { font-size:13px; color:#64748b; line-height:1.6; white-space:pre-wrap; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:100px; font-size:12px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }
  .status-draft { background:#f1f5f9; color:#64748b; }
  .status-sent { background:#e0f2fe; color:#0369a1; }
  .status-accepted { background:#dcfce7; color:#15803d; }
  .footer { margin-top:48px; text-align:center; font-size:11px; color:#94a3b8; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="biz-name">${escHtml(profile.businessName)}</div>
      <div class="biz-info">
        ${profile.ownerName ? escHtml(profile.ownerName) + "<br/>" : ""}
        ${profile.phone ? escHtml(profile.phone) + "<br/>" : ""}
        ${profile.email ? escHtml(profile.email) + "<br/>" : ""}
        ${profile.address ? escHtml(profile.address) : ""}
      </div>
    </div>
    <div class="doc-title">
      <div class="doc-type">ESTIMATE</div>
      <div class="doc-num">${escHtml(estimate.estimateNumber)}</div>
      <div style="margin-top:8px"><span class="status-badge status-${estimate.status}">${estimate.status}</span></div>
    </div>
  </div>
  <hr class="divider"/>
  <div class="parties">
    <div class="party-block">
      <div class="party-label">Bill To</div>
      <div class="party-name">${escHtml(customer.fullName)}</div>
      ${customer.companyName ? `<div class="party-detail">${escHtml(customer.companyName)}</div>` : ""}
      <div class="party-detail">
        ${customer.phone ? escHtml(customer.phone) + "<br/>" : ""}
        ${customer.email ? escHtml(customer.email) + "<br/>" : ""}
        ${customer.serviceAddress ? escHtml(customer.serviceAddress) : ""}
      </div>
    </div>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Date</div>
        <div class="meta-value">${formatDate(estimate.date)}</div>
      </div>
      ${estimate.expirationDate ? `<div class="meta-item"><div class="meta-label">Expires</div><div class="meta-value">${formatDate(estimate.expirationDate)}</div></div>` : ""}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="center">Qty</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>${lineItemsHtml}</tbody>
  </table>
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${formatCurrency(subtotal, sym)}</span></div>
    ${discountAmt > 0 ? `<div class="total-row"><span>Discount</span><span>-${formatCurrency(discountAmt, sym)}</span></div>` : ""}
    <div class="total-row grand"><span>Total</span><span>${formatCurrency(total, sym)}</span></div>
    ${estimate.depositRequested ? `<div class="total-row" style="margin-top:8px;color:#1a56db;"><span>Deposit Requested</span><span>${formatCurrency(estimate.depositRequested, sym)}</span></div>` : ""}
  </div>
  ${estimate.notes ? `<div style="margin-top:32px;"><div class="section-title">Notes</div><div class="section-text">${escHtml(estimate.notes)}</div></div>` : ""}
  ${estimate.terms ? `<div style="margin-top:24px;"><div class="section-title">Terms &amp; Conditions</div><div class="section-text">${escHtml(estimate.terms)}</div></div>` : ""}
  <div class="footer">Generated by QuickBid Pro</div>
</div>
</body>
</html>`;
}

export function buildInvoicePdfHtml(
  invoice: Invoice,
  customer: Customer,
  profile: BusinessProfile
): string {
  const subtotal = calcSubtotal(invoice.lineItems);
  const discountAmt = calcDiscount(subtotal, invoice.discount, invoice.discountType);
  const total = calcTotal(invoice.lineItems, invoice.discount, invoice.discountType);
  const sym = profile.currencySymbol || "$";

  const statusColors: Record<string, string> = {
    draft: "status-draft",
    sent: "status-sent",
    paid: "status-paid",
    unpaid: "status-unpaid",
    overdue: "status-overdue",
  };

  const lineItemsHtml = invoice.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#0f172a;">${escHtml(item.title)}</div>
          ${item.description ? `<div style="color:#64748b;font-size:13px;">${escHtml(item.description)}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;color:#64748b;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;color:#64748b;">${formatCurrency(item.unitPrice, sym)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#0f172a;">${formatCurrency(item.quantity * item.unitPrice, sym)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; margin:0; padding:0; color:#0f172a; background:#fff; }
  .page { max-width:680px; margin:0 auto; padding:48px 40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
  .biz-name { font-size:24px; font-weight:700; color:#0f172a; }
  .biz-info { font-size:13px; color:#64748b; margin-top:4px; line-height:1.6; }
  .doc-title { text-align:right; }
  .doc-type { font-size:32px; font-weight:700; color:#0f172a; letter-spacing:-1px; }
  .doc-num { font-size:14px; color:#64748b; margin-top:4px; }
  .divider { border:none; border-top:2px solid #e2e8f0; margin:24px 0; }
  .parties { display:flex; justify-content:space-between; margin-bottom:32px; }
  .party-label { font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
  .party-name { font-size:15px; font-weight:600; color:#0f172a; }
  .party-detail { font-size:13px; color:#64748b; line-height:1.6; }
  .meta { display:flex; gap:40px; margin-bottom:32px; }
  .meta-item { }
  .meta-label { font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
  .meta-value { font-size:14px; color:#0f172a; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  th { text-align:left; padding-bottom:10px; border-bottom:2px solid #e2e8f0; font-size:12px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; }
  th.right { text-align:right; }
  th.center { text-align:center; }
  .totals { margin-left:auto; width:260px; }
  .total-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
  .total-row.grand { border-top:2px solid #0f172a; margin-top:8px; padding-top:12px; font-size:18px; font-weight:700; }
  .section-title { font-size:12px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
  .section-text { font-size:13px; color:#64748b; line-height:1.6; white-space:pre-wrap; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:100px; font-size:12px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }
  .status-draft { background:#f1f5f9; color:#64748b; }
  .status-sent { background:#e0f2fe; color:#0369a1; }
  .status-paid { background:#dcfce7; color:#15803d; }
  .status-unpaid { background:#fee2e2; color:#dc2626; }
  .status-overdue { background:#fef3c7; color:#d97706; }
  .footer { margin-top:48px; text-align:center; font-size:11px; color:#94a3b8; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="biz-name">${escHtml(profile.businessName)}</div>
      <div class="biz-info">
        ${profile.ownerName ? escHtml(profile.ownerName) + "<br/>" : ""}
        ${profile.phone ? escHtml(profile.phone) + "<br/>" : ""}
        ${profile.email ? escHtml(profile.email) + "<br/>" : ""}
        ${profile.address ? escHtml(profile.address) : ""}
      </div>
    </div>
    <div class="doc-title">
      <div class="doc-type">INVOICE</div>
      <div class="doc-num">${escHtml(invoice.invoiceNumber)}</div>
      <div style="margin-top:8px"><span class="status-badge status-${invoice.status}">${invoice.status}</span></div>
    </div>
  </div>
  <hr class="divider"/>
  <div class="parties">
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${escHtml(customer.fullName)}</div>
      ${customer.companyName ? `<div class="party-detail">${escHtml(customer.companyName)}</div>` : ""}
      <div class="party-detail">
        ${customer.phone ? escHtml(customer.phone) + "<br/>" : ""}
        ${customer.email ? escHtml(customer.email) + "<br/>" : ""}
        ${customer.serviceAddress ? escHtml(customer.serviceAddress) : ""}
      </div>
    </div>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Issue Date</div>
        <div class="meta-value">${formatDate(invoice.issueDate)}</div>
      </div>
      ${invoice.dueDate ? `<div class="meta-item"><div class="meta-label">Due Date</div><div class="meta-value">${formatDate(invoice.dueDate)}</div></div>` : ""}
      ${invoice.paidDate ? `<div class="meta-item"><div class="meta-label">Paid Date</div><div class="meta-value">${formatDate(invoice.paidDate)}</div></div>` : ""}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="center">Qty</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>${lineItemsHtml}</tbody>
  </table>
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${formatCurrency(subtotal, sym)}</span></div>
    ${discountAmt > 0 ? `<div class="total-row"><span>Discount</span><span>-${formatCurrency(discountAmt, sym)}</span></div>` : ""}
    <div class="total-row grand"><span>Total</span><span>${formatCurrency(total, sym)}</span></div>
    ${invoice.depositRequested ? `<div class="total-row" style="margin-top:8px;"><span>Deposit Requested</span><span>${formatCurrency(invoice.depositRequested, sym)}</span></div>` : ""}
  </div>
  ${invoice.paymentNote ? `<div style="margin-top:24px;"><div class="section-title">Payment Instructions</div><div class="section-text">${escHtml(invoice.paymentNote)}</div></div>` : ""}
  ${invoice.notes ? `<div style="margin-top:24px;"><div class="section-title">Notes</div><div class="section-text">${escHtml(invoice.notes)}</div></div>` : ""}
  ${invoice.terms ? `<div style="margin-top:24px;"><div class="section-title">Terms &amp; Conditions</div><div class="section-text">${escHtml(invoice.terms)}</div></div>` : ""}
  <div class="footer">Generated by QuickBid Pro</div>
</div>
</body>
</html>`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
