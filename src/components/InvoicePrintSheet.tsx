import { useEffect, useState, useId, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { Invoice, StudioConfig, MilestonePhase } from '../types/invoice.ts';
import {
  formatIndianCurrency,
  generateUpiUrl,
  isInvoiceOverdue,
} from '../utils/financials.ts';
import { BrandLogo } from './BrandLogo.tsx';
import {
  Printer,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Zap,
} from 'lucide-react';

interface InvoicePrintSheetProps {
  invoice: Invoice;
  studioConfig: StudioConfig;
  onEdit?: () => void;
  onMilestoneToggle?: (phaseId: 1 | 2 | 3) => void;
  onToggleSingleBillPaid?: () => void;
  hidePrintControls?: boolean;
}

export function InvoicePrintSheet({
  invoice,
  studioConfig,
  onEdit,
  onMilestoneToggle,
  onToggleSingleBillPaid,
  hidePrintControls = false,
}: InvoicePrintSheetProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const invoiceSheetRef = useRef<HTMLDivElement>(null);
  const qrDescId = useId();

  const isSingleBill = invoice.billingType === 'single';

  // Target payment amount:
  // If single bill, target is the full 100% amount due.
  // If milestone bill, target first due milestone.
  const dueMilestones = invoice.milestones.filter((m) => m.status === 'DUE');
  const targetMilestone = dueMilestones[0] || invoice.milestones[0];
  const targetPaymentAmount = isSingleBill
    ? invoice.totalAmountDue
    : dueMilestones.length > 0
    ? targetMilestone.amount
    : invoice.totalAmountDue;

  const upiUrl = generateUpiUrl({
    vpa: invoice.bankDetails?.upiId || studioConfig.upiId,
    name: invoice.bankDetails?.accountName || studioConfig.accountName,
    amount: targetPaymentAmount,
    note: `${invoice.invoiceNo} ${
      isSingleBill
        ? 'Full Payment'
        : dueMilestones.length > 0
        ? targetMilestone.name.split(':')[0]
        : 'Full Payment'
    }`,
  });

  useEffect(() => {
    let isMounted = true;
    if (upiUrl) {
      QRCode.toDataURL(upiUrl, {
        width: 130,
        margin: 1,
        color: {
          dark: '#08221B',
          light: '#ffffff',
        },
      })
        .then((url) => {
          if (isMounted) setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate UPI QR code:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [upiUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceSheetRef.current || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);
      const element = invoiceSheetRef.current;

      // Ensure web fonts are completely loaded before rasterization
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Temporarily clear box-shadow and border to prevent artifact clipping
      const prevShadow = element.style.boxShadow;
      const prevBorder = element.style.border;
      element.style.boxShadow = 'none';
      element.style.border = 'none';

      // Render crisp 3.2x canvas for 300+ DPI equivalent sharpness
      const canvas = await html2canvas(element, {
        scale: 3.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
      });

      // Restore screen preview styles
      element.style.boxShadow = prevShadow;
      element.style.border = prevBorder;

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.height / imgProps.width;
      const calculatedHeight = pdfWidth * ratio;

      // Always fit the entire invoice + Terms & Conditions onto a single A4 page
      if (calculatedHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, calculatedHeight);
      } else {
        const scaleFactor = pdfHeight / calculatedHeight;
        const scaledWidth = pdfWidth * scaleFactor;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, pdfHeight);
      }

      pdf.save(`${invoice.invoiceNo}_${(invoice.projectName || 'Invoice').replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isOverdue = isInvoiceOverdue(invoice.dueDate, invoice.masterStatus);

  // Helper to split description into clean title and subtitle
  const parseItemDescription = (rawDesc: string) => {
    if (!rawDesc) return { title: 'Professional Design Services', subtitle: '' };
    if (rawDesc.includes(' — ')) {
      const parts = rawDesc.split(' — ');
      return { title: parts[0].trim(), subtitle: parts.slice(1).join(' — ').trim() };
    }
    return { title: rawDesc, subtitle: '' };
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Action Toolbar (Hidden in Print) — Dark Studio Theme */}
      {!hidePrintControls && (
        <div className="no-print w-full max-w-[210mm] flex flex-wrap items-center justify-between gap-3 mb-5 p-3.5 bg-[#08221B] border border-[#ACBEA3]/35 rounded-2xl shadow-lg font-poppins text-[#F8F4ED]">
          <div className="flex items-center gap-3">
            <span className="font-space-mono font-bold text-sm text-[#F8F4ED]">
              {invoice.invoiceNo}
            </span>
            <span className="text-[#ACBEA3]">·</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  invoice.masterStatus === 'PAID'
                    ? 'bg-[#ACBEA3]/20 text-[#ACBEA3] border border-[#ACBEA3]/40'
                    : invoice.masterStatus === 'PARTIALLY PAID'
                    ? 'bg-[#FFA400]/20 text-[#FFA400] border border-[#FFA400]/50'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {invoice.masterStatus === 'PAID' ? (
                  <CheckCircle2 className="w-3 h-3 text-[#ACBEA3]" />
                ) : (
                  <Clock className="w-3 h-3 text-[#FFA400]" />
                )}
                <span>{invoice.masterStatus}</span>
              </span>

              {/* Billing Mode Badge */}
              <span className="text-[11px] font-medium px-2.5 py-0.5 bg-[#2C3330] border border-[#ACBEA3]/40 text-[#F8F4ED] rounded-full flex items-center gap-1">
                {isSingleBill ? (
                  <>
                    <Zap className="w-3 h-3 text-[#FFA400]" />
                    <span>Single Bill (100%)</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3 h-3 text-[#FFA400]" />
                    <span>3-Phase Milestones</span>
                  </>
                )}
              </span>

              {isOverdue && (
                <span className="text-[11px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Overdue
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-xs font-medium text-[#F8F4ED] bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/40 rounded-xl transition-colors cursor-pointer"
              >
                Edit Form
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#F8F4ED] bg-[#2C3330] hover:bg-[#38423e] border border-[#ACBEA3]/40 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFA400]" />
                  <span>Rendering PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#FFA400]" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-montserrat text-[#08221B] bg-[#FFA400] hover:bg-[#e69400] rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
          </div>
        </div>
      )}

      {/* A4 Sheet Container: Strict Single-Page 210mm x 297mm Geometry */}
      <div
        ref={invoiceSheetRef}
        id="invoice-print-sheet"
        className="a4-sheet bg-white text-[#08221B] shadow-2xl print:shadow-none mx-auto border border-[#ACBEA3]/30 print:border-none relative transition-all flex flex-col justify-between"
        style={{
          width: '210mm',
          minHeight: '297mm',
          maxHeight: '297mm',
          padding: '8.5mm 12mm',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#08221B',
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          overflow: 'hidden',
        }}
      >
        {/* TOP & MIDDLE SECTION: Header, Metadata, Items, Subtotals, Total Bar, Schedule */}
        <div className="space-y-2.5">
          {/* HEADER BAR: Brand Identity in ONE line + "Invoice" (First letter only capital) */}
          <div className="flex items-start justify-between pb-2.5 border-b border-[#08221B]/15">
            {/* Left: [Origami Aperture] Indian Pixel strictly in ONE single line — NO background box */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5 whitespace-nowrap">
                <BrandLogo
                  customLogoUrl={studioConfig.logoDataUrl}
                  size="sm"
                  theme="green"
                  isPrint={true}
                  variant="icon"
                  withText={false}
                />
                <span className="font-montserrat font-bold text-xl tracking-tight text-[#08221B] leading-none whitespace-nowrap">
                  {studioConfig.studioName || 'Indian Pixel'}
                </span>
              </div>
              {studioConfig.address && studioConfig.address.trim().length > 0 && (
                <div className="text-[10px] font-poppins text-[#2C3330]/90 leading-tight pt-0.5 whitespace-nowrap">
                  {studioConfig.address}
                </div>
              )}
              {/* Contact row strictly in ONE line with compact typography */}
              <div className="text-[9px] font-poppins text-[#2C3330]/80 whitespace-nowrap pt-0.5 flex items-center gap-1.5">
                <span>Phone: {studioConfig.phone}</span>
                <span className="text-[#ACBEA3]">·</span>
                <span>Email: {studioConfig.email}</span>
                <span className="text-[#ACBEA3]">·</span>
                <span>Web: {studioConfig.web}</span>
              </div>
              {/* Official Tax & Legal Identity Row: PAN and Tax Status */}
              <div className="text-[9px] font-poppins text-[#08221B] font-medium whitespace-nowrap flex items-center gap-1.5">
                <span>
                  PAN:{' '}
                  <strong className="font-space-mono font-bold text-[#08221B]">
                    {studioConfig.pan || 'KJKPD8069P'}
                  </strong>
                </span>
                <span className="text-[#ACBEA3]">·</span>
                <span>
                  {studioConfig.isGstRegistered &&
                  studioConfig.gstin &&
                  !studioConfig.gstin.toLowerCase().includes('exempt') &&
                  !studioConfig.gstin.toLowerCase().includes('unregistered')
                    ? `GSTIN: ${studioConfig.gstin}`
                    : 'Tax Status: GST Exempt (Sec 22, CGST Act)'}
                </span>
              </div>
            </div>

            {/* Right: "Invoice" with First Letter Only Capital */}
            <div className="text-right space-y-0.5 shrink-0 pl-4">
              <div
                className="text-3xl font-semibold tracking-tight leading-none text-[#08221B]"
                style={{
                  fontFamily:
                    "'Poppins', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                  letterSpacing: '-0.025em',
                }}
              >
                Invoice
              </div>
              <div className="font-space-mono font-bold text-xs tracking-wide text-[#08221B]">
                #{invoice.invoiceNo}
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[9px] font-poppins font-medium bg-[#F8F4ED] text-[#08221B] border border-[#ACBEA3]/50 whitespace-nowrap">
                {studioConfig.isGstRegistered
                  ? 'Tax Invoice (Original for Recipient)'
                  : 'Bill of Supply (Exempt u/s 22 CGST Act)'}
              </div>
            </div>
          </div>

          {/* METADATA GRID: Invoice Dates & Bill-To Client in ONE unified row */}
          <div className="grid grid-cols-2 gap-6 text-[11px] font-poppins">
            {/* Bill To Column */}
            <div className="space-y-0.5">
              <span className="font-montserrat font-bold text-[9px] uppercase tracking-wider text-[#08221B] block">
                BILLED TO:
              </span>
              <div className="font-montserrat font-bold text-xs text-[#08221B]">
                {invoice.client.name || 'Valued Client'}
              </div>
              <div className="text-[10.5px] text-[#2C3330] leading-snug">
                {invoice.client.address || 'Client Address, City, State, PIN'}
              </div>
              {(invoice.client.phone || invoice.client.email) && (
                <div className="text-[10px] text-[#2C3330] whitespace-nowrap">
                  {invoice.client.phone && <span>Phone: {invoice.client.phone}</span>}
                  {invoice.client.phone && invoice.client.email && (
                    <span className="mx-1 text-[#ACBEA3]">·</span>
                  )}
                  {invoice.client.email && <span>{invoice.client.email}</span>}
                </div>
              )}
              {invoice.client.gstin && (
                <div className="text-[10px] font-space-mono font-semibold text-[#08221B] whitespace-nowrap">
                  Client GSTIN: {invoice.client.gstin}
                </div>
              )}
            </div>

            {/* Invoice Details Column */}
            <div className="space-y-0.5 text-right font-poppins">
              <div className="flex justify-between sm:justify-end gap-4 text-[11px]">
                <span className="text-[#2C3330] font-medium whitespace-nowrap">Invoice Date:</span>
                <span className="font-space-mono font-bold text-[#08221B] whitespace-nowrap">
                  {invoice.date}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4 text-[11px]">
                <span className="text-[#2C3330] font-medium whitespace-nowrap">Payment Due:</span>
                <span
                  className={`font-space-mono font-bold whitespace-nowrap ${
                    isOverdue ? 'text-red-600' : 'text-[#08221B]'
                  }`}
                >
                  {invoice.dueDate}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4 text-[11px]">
                <span className="text-[#2C3330] font-medium whitespace-nowrap">
                  Project Reference:
                </span>
                <span className="font-semibold text-[#08221B] max-w-[230px] truncate whitespace-nowrap">
                  {invoice.projectName || 'Dynamic Brand Identity & Media'}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4 text-[11px]">
                <span className="text-[#2C3330] font-medium whitespace-nowrap">
                  Settlement Mode:
                </span>
                <span className="font-semibold text-[#08221B] whitespace-nowrap">
                  {isSingleBill ? 'Single Bill (100% Full Payment)' : '3-Phase Milestone Schedule'}
                </span>
              </div>
              {invoice.reverseCharge && (
                <div className="flex justify-between sm:justify-end gap-4 text-[11px]">
                  <span className="text-[#2C3330] font-medium whitespace-nowrap">Tax on RCM:</span>
                  <span className="font-semibold text-[#08221B] whitespace-nowrap">Yes</span>
                </div>
              )}
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          <div>
            <table className="w-full text-left border-collapse text-[11px] font-poppins">
              <thead>
                <tr className="bg-[#08221B] text-white font-montserrat text-[9px] uppercase tracking-wider">
                  <th className="py-1.5 px-2.5 w-8 text-center">#</th>
                  <th className="py-1.5 px-2.5">ITEM DESCRIPTION</th>
                  <th className="py-1.5 px-2 text-center w-16">SAC</th>
                  <th className="py-1.5 px-2 text-center w-12">QTY</th>
                  <th className="py-1.5 px-2 text-center w-16">UNIT</th>
                  <th className="py-1.5 px-2.5 text-right w-24">RATE (₹)</th>
                  <th className="py-1.5 px-2.5 text-right w-28">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ACBEA3]/25">
                {invoice.items.map((item, index) => {
                  const { title, subtitle } = parseItemDescription(item.description);
                  return (
                    <tr key={item.id} className="hover:bg-[#F8F4ED]/40 transition-colors">
                      <td className="py-1.5 px-2.5 text-center font-space-mono text-[11px] text-[#2C3330]">
                        {index + 1}
                      </td>
                      <td className="py-1.5 px-2.5 text-[#08221B]">
                        <div className="font-semibold leading-tight">{title}</div>
                        {subtitle && (
                          <div className="text-[9.5px] text-[#2C3330]/75 leading-tight pt-0.5">
                            {subtitle}
                          </div>
                        )}
                        {item.itemDiscountAmount && item.itemDiscountAmount > 0 ? (
                          <span className="text-[9px] text-emerald-700 font-medium font-poppins block pt-0.5">
                            Item concession: -{formatIndianCurrency(item.itemDiscountAmount)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-1.5 px-2 text-center font-space-mono text-[10.5px] text-[#2C3330] whitespace-nowrap">
                        {item.sacCode || '998311'}
                      </td>
                      <td className="py-1.5 px-2 text-center font-space-mono tabular-nums text-[#2C3330] whitespace-nowrap">
                        {item.qty}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[#2C3330] text-[10.5px] whitespace-nowrap">
                        {item.unit}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-space-mono tabular-nums text-[#2C3330] whitespace-nowrap">
                        {formatIndianCurrency(item.rate, false)}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-space-mono font-semibold tabular-nums text-[#08221B] whitespace-nowrap">
                        {formatIndianCurrency(item.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Subtotals & Tax Breakdown */}
          <div className="flex flex-col items-end font-poppins text-[11px]">
            <div className="w-96 max-w-full space-y-0.5 text-right">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[#2C3330] font-medium">Subtotal</span>
                <span className="font-space-mono tabular-nums font-semibold text-[#08221B] whitespace-nowrap pl-4">
                  {formatIndianCurrency(invoice.subtotal)}
                </span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex items-start justify-between gap-4 py-0.5 text-emerald-700">
                  <span className="font-medium text-left flex-1 leading-tight">
                    Discount{' '}
                    {invoice.discountReason ? `(${invoice.discountReason})` : ''}
                    {invoice.discountType === 'percentage' ? ` [${invoice.discountValue}%]` : ''}
                  </span>
                  <span className="font-space-mono tabular-nums font-bold whitespace-nowrap shrink-0">
                    - {formatIndianCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-0.5 border-t border-[#ACBEA3]/25 pt-1">
                <span className="text-[#2C3330] font-medium">Taxable Base</span>
                <span className="font-space-mono tabular-nums font-semibold text-[#08221B] whitespace-nowrap pl-4">
                  {formatIndianCurrency(invoice.taxableAmount)}
                </span>
              </div>

              {invoice.gstType === 'intra' && (
                <>
                  <div className="flex justify-between items-center py-0.5 text-[10.5px]">
                    <span className="text-[#2C3330]">CGST @ [{invoice.cgstRate}%]</span>
                    <span className="font-space-mono tabular-nums font-medium text-[#08221B] whitespace-nowrap pl-4">
                      {formatIndianCurrency(invoice.cgstAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-[10.5px]">
                    <span className="text-[#2C3330]">SGST @ [{invoice.sgstRate}%]</span>
                    <span className="font-space-mono tabular-nums font-medium text-[#08221B] whitespace-nowrap pl-4">
                      {formatIndianCurrency(invoice.sgstAmount)}
                    </span>
                  </div>
                </>
              )}

              {invoice.gstType === 'inter' && (
                <div className="flex justify-between items-center py-0.5 text-[10.5px]">
                  <span className="text-[#2C3330]">IGST @ [{invoice.igstRate}%]</span>
                  <span className="font-space-mono tabular-nums font-medium text-[#08221B] whitespace-nowrap pl-4">
                    {formatIndianCurrency(invoice.igstAmount)}
                  </span>
                </div>
              )}

              {invoice.cessAmount && invoice.cessAmount > 0 ? (
                <div className="flex justify-between items-center py-0.5 text-[10.5px]">
                  <span className="text-[#2C3330]">
                    Compensation Cess @ [{invoice.cessRate}%]
                  </span>
                  <span className="font-space-mono tabular-nums font-medium text-[#08221B] whitespace-nowrap pl-4">
                    {formatIndianCurrency(invoice.cessAmount)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Total Amount Due Bar: Midnight Green Background with Amber Yellow Highlight */}
          <div className="bg-[#08221B] text-white px-4 py-2 rounded-xl flex items-center justify-between font-poppins shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFA400]"></span>
              <span className="font-montserrat font-bold text-xs tracking-wider uppercase text-white">
                TOTAL AMOUNT DUE
              </span>
            </div>
            <span className="font-space-mono text-base font-bold tabular-nums text-[#FFA400] whitespace-nowrap">
              {formatIndianCurrency(invoice.totalAmountDue)}
            </span>
          </div>

          {/* TDS / Net Bank Settlement (If applicable under 194J) */}
          {invoice.tdsApplicable && invoice.tdsAmount && invoice.tdsAmount > 0 && (
            <div className="px-3 py-1 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-lg text-[10px] font-poppins flex items-center justify-between">
              <div className="text-[#2C3330]">
                <span className="font-semibold text-[#08221B]">
                  Less: Client TDS ({invoice.tdsSection || 'Sec. 194J'} @ {invoice.tdsRate}%):
                </span>{' '}
                <span className="font-space-mono font-bold text-red-600">
                  - {formatIndianCurrency(invoice.tdsAmount)}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#2C3330]">Net Bank Receivable:</span>{' '}
                <span className="font-space-mono font-bold text-[#08221B]">
                  {formatIndianCurrency(
                    invoice.netReceivableAfterTds || invoice.totalAmountDue - invoice.tdsAmount
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Amount in words & Master Payment Status strictly in ONE line */}
          <div className="flex items-center justify-between text-[10px] font-poppins py-1 border-b border-[#08221B]/15 text-[#2C3330]">
            <div className="truncate pr-4">
              <span className="font-semibold text-[#08221B]">Amount in Words:</span>{' '}
              <span className="italic">{invoice.amountInWords}</span>
            </div>
            <div className="whitespace-nowrap shrink-0">
              <span className="font-semibold text-[#08221B]">Payment Status:</span>{' '}
              <span className="font-bold text-[#08221B]">[{invoice.masterStatus}]</span>
            </div>
          </div>

          {/* PAYMENT SCHEDULE / TERMS SECTION: Either Single Bill OR 3-Phase Milestone */}
          <div>
            {isSingleBill ? (
              /* Single Bill 100% Payment Schedule */
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-montserrat font-bold text-[10px] uppercase tracking-wider text-[#08221B] flex items-center gap-1.5 whitespace-nowrap">
                    <Zap className="w-3 h-3 text-[#FFA400]" />
                    <span>PAYMENT SCHEDULE · SINGLE BILL (100% FULL SETTLEMENT)</span>
                  </h2>
                  <span className="font-poppins text-[9px] text-[#2C3330]/70 whitespace-nowrap">
                    One-time full payment
                  </span>
                </div>

                <table className="w-full text-left border-collapse text-[11px] font-poppins">
                  <thead>
                    <tr className="bg-[#08221B] text-white font-montserrat text-[8.5px] uppercase tracking-wider">
                      <th className="py-1.5 px-2.5">SETTLEMENT TYPE</th>
                      <th className="py-1.5 px-2.5">DUE DATE</th>
                      <th className="py-1.5 px-2 text-center w-16">SHARE</th>
                      <th className="py-1.5 px-2.5 text-right w-32">PAYABLE AMOUNT</th>
                      <th className="py-1.5 px-2.5 text-center w-24">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ACBEA3]/25">
                    <tr className="hover:bg-[#F8F4ED]/40">
                      <td className="py-1.5 px-2.5 font-semibold text-[#08221B]">
                        Full Invoice Settlement (100%)
                        {invoice.singleBillPaidAt && (
                          <span className="text-[9px] text-[#2C3330]/70 font-normal block">
                            Paid on {invoice.singleBillPaidAt}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 font-space-mono text-[#2C3330] whitespace-nowrap">
                        {invoice.dueDate || 'Upon Receipt'}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[#2C3330] font-semibold">
                        100%
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-space-mono tabular-nums font-bold text-[#08221B] whitespace-nowrap">
                        {formatIndianCurrency(invoice.totalAmountDue)}
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleSingleBillPaid?.()}
                          className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-poppins font-semibold transition-colors ${
                            invoice.singleBillPaid || invoice.masterStatus === 'PAID'
                              ? 'bg-[#ACBEA3] text-[#08221B]'
                              : 'bg-[#F8F4ED] text-[#2C3330] hover:bg-[#ACBEA3]/30 border border-[#ACBEA3]'
                          }`}
                          title="Click to toggle Paid/Due"
                        >
                          [
                          {invoice.singleBillPaid || invoice.masterStatus === 'PAID'
                            ? 'Paid'
                            : 'Due'}
                          ]
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              /* 40% - 40% - 20% Milestone Schedule */
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-montserrat font-bold text-[10px] uppercase tracking-wider text-[#08221B] flex items-center gap-1.5 whitespace-nowrap">
                    <Layers className="w-3 h-3 text-[#08221B]" />
                    <span>PAYMENT SCHEDULE (40% — 40% — 20%)</span>
                  </h2>
                  <span className="font-poppins text-[9px] text-[#2C3330]/70 whitespace-nowrap">
                    Phased milestone delivery
                  </span>
                </div>

                <table className="w-full text-left border-collapse text-[11px] font-poppins">
                  <thead>
                    <tr className="bg-[#08221B] text-white font-montserrat text-[8.5px] uppercase tracking-wider">
                      <th className="py-1 px-2.5 w-16">PHASE</th>
                      <th className="py-1 px-2.5">MILESTONE</th>
                      <th className="py-1 px-2 text-center w-14">%</th>
                      <th className="py-1 px-2.5 text-right w-28">AMOUNT</th>
                      <th className="py-1 px-2.5 text-center w-20">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ACBEA3]/25">
                    {invoice.milestones.map((phase: MilestonePhase) => {
                      const isPaid = phase.status === 'PAID';
                      return (
                        <tr key={phase.phaseId} className="hover:bg-[#F8F4ED]/40">
                          <td className="py-1 px-2.5 font-medium text-[#08221B] whitespace-nowrap">
                            Phase {phase.phaseId}
                          </td>
                          <td className="py-1 px-2.5 text-[#2C3330]">
                            {phase.name.split(':')[1]?.trim() || phase.name}
                          </td>
                          <td className="py-1 px-2 text-center text-[#2C3330] font-semibold">
                            {phase.percentage}%
                          </td>
                          <td className="py-1 px-2.5 text-right font-space-mono tabular-nums font-semibold text-[#08221B] whitespace-nowrap">
                            {formatIndianCurrency(phase.amount)}
                          </td>
                          <td className="py-1 px-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => onMilestoneToggle?.(phase.phaseId)}
                              className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-poppins font-semibold transition-colors ${
                                isPaid
                                  ? 'bg-[#ACBEA3] text-[#08221B]'
                                  : 'bg-[#F8F4ED] text-[#2C3330] hover:bg-[#ACBEA3]/30 border border-[#ACBEA3]'
                              }`}
                              title="Click to toggle Paid/Due"
                            >
                              [{isPaid ? 'Paid' : 'Due'}]
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ANCHORED SECTION: Bank + QR Side-by-Side, Full Terms & Conditions on Page 1, Signatory & Footer */}
        <div className="pt-2 border-t border-[#08221B]/15 space-y-2 text-xs font-poppins">
          {/* Row 1: Bank Settlement + UPI QR Side-by-Side on Left, Authorized Signatory on Right */}
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Left 8 Cols: Bank Details & UPI QR Side-by-Side */}
            <div className="col-span-8 flex items-center justify-between gap-3 bg-[#F8F4ED]/50 border border-[#ACBEA3]/35 rounded-xl p-2.5">
              <div className="space-y-0.5 text-[#2C3330] text-[9.5px] leading-snug">
                <span className="font-montserrat font-bold text-[9.5px] text-[#08221B] tracking-wider uppercase block mb-0.5">
                  PAYMENT SETTLEMENT DETAILS
                </span>
                <div>
                  <span className="font-medium text-[#08221B]">Bank:</span>{' '}
                  {invoice.bankDetails.bankName || studioConfig.bankName} ·{' '}
                  <span className="font-medium text-[#08221B]">A/C Name:</span>{' '}
                  {invoice.bankDetails.accountName || studioConfig.accountName}
                </div>
                <div>
                  <span className="font-medium text-[#08221B]">A/C No:</span>{' '}
                  <span className="font-space-mono font-bold text-[#08221B]">
                    {invoice.bankDetails.accountNumber || studioConfig.accountNumber}
                  </span>{' '}
                  · <span className="font-medium text-[#08221B]">IFSC:</span>{' '}
                  <span className="font-space-mono font-bold text-[#08221B]">
                    {invoice.bankDetails.ifscCode || studioConfig.ifscCode}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#08221B]">UPI ID:</span>{' '}
                  <span className="font-space-mono font-bold text-[#08221B]">
                    {invoice.bankDetails.upiId || studioConfig.upiId}
                  </span>
                </div>
              </div>

              {/* Scannable UPI QR Side-by-Side */}
              {qrDataUrl && (
                <div className="flex items-center gap-2 pl-2.5 border-l border-[#ACBEA3]/40 shrink-0">
                  <img
                    src={qrDataUrl}
                    alt="UPI QR Code"
                    aria-describedby={qrDescId}
                    className="w-14 h-14 border border-[#ACBEA3] p-0.5 bg-white rounded-sm shrink-0"
                  />
                  <div id={qrDescId} className="text-[8.5px] text-[#2C3330] leading-tight">
                    <span className="font-montserrat font-bold block text-[#08221B] uppercase tracking-wide">
                      SCAN TO PAY
                    </span>
                    <span className="font-space-mono font-bold text-[#08221B] block">
                      {formatIndianCurrency(targetPaymentAmount)}
                    </span>
                    <span className="text-[7.5px] text-[#2C3330]/70 block">
                      GPay · PhonePe · BHIM
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Authorized Signatory */}
            <div className="col-span-4 text-right flex flex-col justify-between h-full py-1">
              <div className="font-montserrat font-bold text-[9.5px] text-[#08221B] uppercase tracking-wider">
                FOR {(studioConfig.studioName || 'INDIAN PIXEL').toUpperCase()}
              </div>
              <div className="pt-5">
                <div className="border-b border-[#08221B] w-36 ml-auto mb-0.5"></div>
                <div className="text-[10px] font-semibold text-[#08221B]">
                  Authorized Signatory
                </div>
                <div className="text-[8.5px] text-[#2C3330]/70">
                  Design Studio Lead &amp; Principal
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Full-Width Terms & Conditions Guaranteed on Page 1 */}
          <div className="px-3 py-1.5 rounded-lg bg-[#F8F4ED]/60 border border-[#ACBEA3]/35 text-[8.5px] text-[#2C3330] leading-snug">
            <span className="font-montserrat font-bold text-[9px] text-[#08221B] uppercase tracking-wider block mb-0.5">
              ⓘ TERMS &amp; CONDITIONS
            </span>
            <div className="whitespace-pre-line text-[#2C3330]/90">
              {invoice.termsAndConditions || studioConfig.defaultTerms}
            </div>
          </div>

          {/* Row 3: Document Footer strictly in ONE single line */}
          <div className="pt-1.5 border-t border-[#08221B]/15 text-center font-poppins text-[9px] text-[#2C3330]/75 whitespace-nowrap flex items-center justify-center gap-2">
            <span>Indian Pixel Graphic Design Solutions</span>
            <span className="text-[#ACBEA3]">·</span>
            <span>{studioConfig.web || 'website-indianpixel.vercel.app'}</span>
            <span className="text-[#ACBEA3]">·</span>
            <span>{studioConfig.email || 'theindianpixel@gmail.com'}</span>
            <span className="text-[#ACBEA3]">·</span>
            <span>{studioConfig.phone || '+91 7585999426'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
