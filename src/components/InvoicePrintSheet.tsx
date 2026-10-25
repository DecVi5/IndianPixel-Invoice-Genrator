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

      // When height fits within A4 page budget (with small margin tolerance)
      if (calculatedHeight <= 298) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(calculatedHeight, pdfHeight));
      } else {
        // Multi-page handling with proper page slicing
        let heightLeft = calculatedHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, calculatedHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - calculatedHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, calculatedHeight);
          heightLeft -= pdfHeight;
        }
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
      {/* Top Action Toolbar (Hidden in Print) */}
      {!hidePrintControls && (
        <div className="no-print w-full max-w-[210mm] flex flex-wrap items-center justify-between gap-3 mb-5 p-3.5 bg-white border border-[#ACBEA3]/40 rounded-2xl shadow-xs font-poppins">
          <div className="flex items-center gap-3">
            <span className="font-space-mono font-bold text-sm text-[#08221B]">
              {invoice.invoiceNo}
            </span>
            <span className="text-[#ACBEA3]">·</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  invoice.masterStatus === 'PAID'
                    ? 'bg-[#08221B] text-[#ACBEA3]'
                    : invoice.masterStatus === 'PARTIALLY PAID'
                    ? 'bg-[#FFA400]/20 text-[#08221B] border border-[#FFA400]/60'
                    : 'bg-red-50 text-red-600 border border-red-200'
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
              <span className="text-[11px] font-medium px-2 py-0.5 bg-[#F8F4ED] border border-[#ACBEA3]/50 text-[#08221B] rounded-full flex items-center gap-1">
                {isSingleBill ? (
                  <>
                    <Zap className="w-3 h-3 text-[#FFA400]" />
                    <span>Single Bill (100%)</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3 h-3 text-[#08221B]" />
                    <span>3-Phase Milestones</span>
                  </>
                )}
              </span>

              {isOverdue && (
                <span className="text-[11px] font-bold text-red-600 bg-red-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Overdue
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-xs font-medium text-[#08221B] bg-[#F8F4ED] hover:bg-[#ACBEA3]/25 border border-[#ACBEA3]/60 rounded-xl transition-colors cursor-pointer"
              >
                Edit Form
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#08221B] bg-white hover:bg-[#F8F4ED] border border-[#ACBEA3]/60 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#08221B]" />
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

      {/* A4 Sheet Container: Strict 210mm x 297mm Geometry */}
      <div
        ref={invoiceSheetRef}
        id="invoice-print-sheet"
        className="a4-sheet bg-white text-[#08221B] shadow-2xl print:shadow-none mx-auto border border-[#ACBEA3]/30 print:border-none relative transition-all"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '13mm 16mm',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#08221B',
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        }}
      >
        {/* HEADER BAR: Brand Identity in ONE line + "Invoice" (First letter only capital) */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#08221B]/15">
          {/* Left: [Origami Aperture] Indian Pixel strictly in ONE single line */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="w-10 h-10 rounded-xl bg-[#08221B] flex items-center justify-center p-1.5 shadow-xs shrink-0">
                <BrandLogo
                  customLogoUrl={studioConfig.logoDataUrl}
                  size="sm"
                  theme="white"
                  variant="icon"
                  withText={false}
                />
              </div>
              <span className="font-montserrat font-bold text-2xl tracking-tight text-[#08221B] leading-none whitespace-nowrap">
                {studioConfig.studioName || 'Indian Pixel'}
              </span>
            </div>
            {studioConfig.address && studioConfig.address.trim().length > 0 && (
              <div className="text-[10.5px] font-poppins text-[#2C3330]/90 leading-tight pt-0.5 whitespace-nowrap">
                {studioConfig.address}
              </div>
            )}
            {/* Contact row strictly in ONE line with compact typography */}
            <div className="text-[9.5px] font-poppins text-[#2C3330]/80 whitespace-nowrap pt-0.5 flex items-center gap-1.5">
              <span>Phone: {studioConfig.phone}</span>
              <span className="text-[#ACBEA3]">·</span>
              <span>Email: {studioConfig.email}</span>
              <span className="text-[#ACBEA3]">·</span>
              <span>Web: {studioConfig.web}</span>
            </div>
            {/* Official Tax & Legal Identity Row: PAN and Tax Status */}
            <div className="text-[9.5px] font-poppins text-[#08221B] font-medium mt-0.5 whitespace-nowrap flex items-center gap-1.5">
              <span>PAN: <strong className="font-space-mono font-bold text-[#08221B]">{studioConfig.pan || 'KJKPD8069P'}</strong></span>
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

          {/* Right: "Invoice" with First Letter Only Capital in clean, elegant Apple Human Typography */}
          <div className="text-right space-y-1 shrink-0 pl-4">
            <div
              className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none text-[#08221B]"
              style={{
                fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                letterSpacing: '-0.025em',
              }}
            >
              Invoice
            </div>
            <div className="font-space-mono font-bold text-sm tracking-wide text-[#08221B]">
              #{invoice.invoiceNo}
            </div>
            <div className="inline-block px-2 py-0.5 rounded text-[9.5px] font-poppins font-medium bg-[#F8F4ED] text-[#08221B] border border-[#ACBEA3]/50 whitespace-nowrap">
              {studioConfig.isGstRegistered
                ? 'Tax Invoice (Original for Recipient)'
                : 'Bill of Supply (Exempt u/s 22 CGST Act)'}
            </div>
          </div>
        </div>

        {/* METADATA GRID: Invoice Dates & Bill-To Client in ONE unified row */}
        <div className="grid grid-cols-2 gap-8 my-4 text-xs font-poppins">
          {/* Bill To Column */}
          <div className="space-y-0.5">
            <span className="font-montserrat font-bold text-[9.5px] uppercase tracking-wider text-[#08221B] block mb-1">
              BILLED TO:
            </span>
            <div className="font-montserrat font-bold text-sm text-[#08221B]">
              {invoice.client.name || 'Valued Client'}
            </div>
            <div className="text-[11px] text-[#2C3330] leading-snug">
              {invoice.client.address || 'Client Address, City, State, PIN'}
            </div>
            {(invoice.client.phone || invoice.client.email) && (
              <div className="text-[10.5px] text-[#2C3330] whitespace-nowrap pt-0.5">
                {invoice.client.phone && <span>Phone: {invoice.client.phone}</span>}
                {invoice.client.phone && invoice.client.email && (
                  <span className="mx-1 text-[#ACBEA3]">·</span>
                )}
                {invoice.client.email && <span>{invoice.client.email}</span>}
              </div>
            )}
            {invoice.client.gstin && (
              <div className="text-[10.5px] font-space-mono font-semibold text-[#08221B] pt-0.5 whitespace-nowrap">
                Client GSTIN: {invoice.client.gstin}
              </div>
            )}
          </div>

          {/* Invoice Details Column — Each metadata row in ONE clean line */}
          <div className="space-y-1 text-right font-poppins">
            <div className="flex justify-between sm:justify-end gap-5 text-xs">
              <span className="text-[#2C3330] font-medium whitespace-nowrap">Invoice Date:</span>
              <span className="font-space-mono font-bold text-[#08221B] whitespace-nowrap">
                {invoice.date}
              </span>
            </div>
            <div className="flex justify-between sm:justify-end gap-5 text-xs">
              <span className="text-[#2C3330] font-medium whitespace-nowrap">Payment Due:</span>
              <span
                className={`font-space-mono font-bold whitespace-nowrap ${
                  isOverdue ? 'text-red-600' : 'text-[#08221B]'
                }`}
              >
                {invoice.dueDate}
              </span>
            </div>
            <div className="flex justify-between sm:justify-end gap-5 text-xs">
              <span className="text-[#2C3330] font-medium whitespace-nowrap">Project Reference:</span>
              <span className="font-semibold text-[#08221B] max-w-[220px] truncate whitespace-nowrap">
                {invoice.projectName || 'Dynamic Brand Identity & Media'}
              </span>
            </div>
            <div className="flex justify-between sm:justify-end gap-5 text-xs">
              <span className="text-[#2C3330] font-medium whitespace-nowrap">Settlement Mode:</span>
              <span className="font-semibold text-[#08221B] whitespace-nowrap">
                {isSingleBill ? 'Single Bill (100% Full Payment)' : '3-Phase Milestone Schedule'}
              </span>
            </div>
            {invoice.reverseCharge && (
              <div className="flex justify-between sm:justify-end gap-5 text-xs">
                <span className="text-[#2C3330] font-medium whitespace-nowrap">Tax on RCM:</span>
                <span className="font-semibold text-[#08221B] whitespace-nowrap">Yes</span>
              </div>
            )}
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="mt-3 mb-3">
          <table className="w-full text-left border-collapse text-xs font-poppins">
            <thead>
              <tr className="bg-[#08221B] text-white font-montserrat text-[9.5px] uppercase tracking-wider">
                <th className="py-2 px-3 w-10 text-center">#</th>
                <th className="py-2 px-3">ITEM DESCRIPTION</th>
                <th className="py-2 px-3 text-center w-20">SAC</th>
                <th className="py-2 px-3 text-center w-14">QTY</th>
                <th className="py-2 px-3 text-center w-16">UNIT</th>
                <th className="py-2 px-3 text-right w-24">RATE (₹)</th>
                <th className="py-2 px-3 text-right w-28">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ACBEA3]/25">
              {invoice.items.map((item, index) => {
                const { title, subtitle } = parseItemDescription(item.description);
                return (
                  <tr key={item.id} className="hover:bg-[#F8F4ED]/40 transition-colors">
                    <td className="py-2 px-3 text-center font-space-mono text-xs text-[#2C3330]">
                      {index + 1}
                    </td>
                    <td className="py-2 px-3 text-[#08221B]">
                      <div className="font-semibold leading-tight">{title}</div>
                      {subtitle && (
                        <div className="text-[10px] text-[#2C3330]/75 leading-tight pt-0.5">
                          {subtitle}
                        </div>
                      )}
                      {item.itemDiscountAmount && item.itemDiscountAmount > 0 ? (
                        <span className="text-[9.5px] text-red-600 font-poppins block pt-0.5">
                          Item concession: -{formatIndianCurrency(item.itemDiscountAmount)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 px-3 text-center font-space-mono text-[11px] text-[#2C3330]">
                      {item.sacCode || '998311'}
                    </td>
                    <td className="py-2 px-3 text-center font-space-mono tabular-nums text-[#2C3330]">
                      {item.qty}
                    </td>
                    <td className="py-2 px-3 text-center text-[#2C3330] text-[11px]">{item.unit}</td>
                    <td className="py-2 px-3 text-right font-space-mono tabular-nums text-[#2C3330]">
                      {formatIndianCurrency(item.rate, false)}
                    </td>
                    <td className="py-2 px-3 text-right font-space-mono font-semibold tabular-nums text-[#08221B]">
                      {formatIndianCurrency(item.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Subtotals & Tax Breakdown */}
        <div className="flex flex-col items-end mb-3 font-poppins text-xs">
          <div className="w-80 space-y-1 text-right">
            <div className="flex justify-between py-0.5">
              <span className="text-[#2C3330] font-medium">Subtotal</span>
              <span className="font-space-mono tabular-nums font-semibold text-[#08221B]">
                {formatIndianCurrency(invoice.subtotal)}
              </span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between py-0.5 text-red-600">
                <span className="font-medium">
                  Discount{' '}
                  {invoice.discountReason ? `(${invoice.discountReason})` : ''}
                  {invoice.discountType === 'percentage' ? ` [${invoice.discountValue}%]` : ''}
                </span>
                <span className="font-space-mono tabular-nums font-bold">
                  - {formatIndianCurrency(invoice.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-0.5 border-t border-[#ACBEA3]/25 pt-1">
              <span className="text-[#2C3330] font-medium">Taxable Base</span>
              <span className="font-space-mono tabular-nums font-semibold text-[#08221B]">
                {formatIndianCurrency(invoice.taxableAmount)}
              </span>
            </div>

            {invoice.gstType === 'intra' && (
              <>
                <div className="flex justify-between py-0.5 text-[11.5px]">
                  <span className="text-[#2C3330]">CGST @ [{invoice.cgstRate}%]</span>
                  <span className="font-space-mono tabular-nums font-medium text-[#08221B]">
                    {formatIndianCurrency(invoice.cgstAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 text-[11.5px]">
                  <span className="text-[#2C3330]">SGST @ [{invoice.sgstRate}%]</span>
                  <span className="font-space-mono tabular-nums font-medium text-[#08221B]">
                    {formatIndianCurrency(invoice.sgstAmount)}
                  </span>
                </div>
              </>
            )}

            {invoice.gstType === 'inter' && (
              <div className="flex justify-between py-0.5 text-[11.5px]">
                <span className="text-[#2C3330]">IGST @ [{invoice.igstRate}%]</span>
                <span className="font-space-mono tabular-nums font-medium text-[#08221B]">
                  {formatIndianCurrency(invoice.igstAmount)}
                </span>
              </div>
            )}

            {invoice.cessAmount && invoice.cessAmount > 0 ? (
              <div className="flex justify-between py-0.5 text-[11.5px]">
                <span className="text-[#2C3330]">Compensation Cess @ [{invoice.cessRate}%]</span>
                <span className="font-space-mono tabular-nums font-medium text-[#08221B]">
                  {formatIndianCurrency(invoice.cessAmount)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Total Amount Due Bar: Midnight Green Background with Amber Yellow Highlight */}
        <div className="bg-[#08221B] text-white px-4 py-2.5 rounded-xl flex items-center justify-between mb-3 font-poppins shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFA400]"></span>
            <span className="font-montserrat font-bold text-xs sm:text-sm tracking-wider uppercase text-white">
              TOTAL AMOUNT DUE
            </span>
          </div>
          <span className="font-space-mono text-base sm:text-lg font-bold tabular-nums text-[#FFA400]">
            {formatIndianCurrency(invoice.totalAmountDue)}
          </span>
        </div>

        {/* TDS / Net Bank Settlement (If applicable under 194J) */}
        {invoice.tdsApplicable && invoice.tdsAmount && invoice.tdsAmount > 0 && (
          <div className="mb-2.5 px-3.5 py-1.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-lg text-xs font-poppins flex items-center justify-between">
            <div className="text-[10.5px] text-[#2C3330]">
              <span className="font-semibold text-[#08221B]">
                Less: Client TDS Deduction ({invoice.tdsSection || 'Sec. 194J'} @ {invoice.tdsRate}%):
              </span>{' '}
              <span className="font-space-mono font-bold text-red-600">
                - {formatIndianCurrency(invoice.tdsAmount)}
              </span>
            </div>
            <div className="text-xs">
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
        <div className="flex items-center justify-between text-[10.5px] font-poppins py-1.5 border-b border-[#08221B]/15 text-[#2C3330]">
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
        <div className="mt-3.5 mb-3.5">
          {isSingleBill ? (
            /* Single Bill 100% Payment Schedule */
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="font-montserrat font-bold text-[11px] uppercase tracking-wider text-[#08221B] flex items-center gap-1.5 whitespace-nowrap">
                  <Zap className="w-3 h-3 text-[#FFA400]" />
                  <span>PAYMENT SCHEDULE · SINGLE BILL (100% FULL SETTLEMENT)</span>
                </h2>
                <span className="font-poppins text-[9.5px] text-[#2C3330]/70 whitespace-nowrap">
                  One-time full payment
                </span>
              </div>

              <table className="w-full text-left border-collapse text-xs font-poppins">
                <thead>
                  <tr className="bg-[#08221B] text-white font-montserrat text-[9px] uppercase tracking-wider">
                    <th className="py-2 px-3">SETTLEMENT TYPE</th>
                    <th className="py-2 px-3">DUE DATE</th>
                    <th className="py-2 px-3 text-center w-20">SHARE</th>
                    <th className="py-2 px-3 text-right w-36">PAYABLE AMOUNT</th>
                    <th className="py-2 px-3 text-center w-28">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ACBEA3]/25">
                  <tr className="hover:bg-[#F8F4ED]/40">
                    <td className="py-2 px-3 font-semibold text-[#08221B]">
                      Full Invoice Settlement (100%)
                      {invoice.singleBillPaidAt && (
                        <span className="text-[9.5px] text-[#2C3330]/70 font-normal block">
                          Paid on {invoice.singleBillPaidAt}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-space-mono text-[#2C3330]">
                      {invoice.dueDate || 'Upon Receipt'}
                    </td>
                    <td className="py-2 px-3 text-center text-[#2C3330] font-semibold">100%</td>
                    <td className="py-2 px-3 text-right font-space-mono tabular-nums font-bold text-[#08221B]">
                      {formatIndianCurrency(invoice.totalAmountDue)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleSingleBillPaid?.()}
                        className={`cursor-pointer px-2.5 py-0.5 rounded text-[9.5px] font-poppins font-semibold transition-colors ${
                          invoice.singleBillPaid || invoice.masterStatus === 'PAID'
                            ? 'bg-[#ACBEA3] text-[#08221B]'
                            : 'bg-[#F8F4ED] text-[#2C3330] hover:bg-[#ACBEA3]/30 border border-[#ACBEA3]'
                        }`}
                        title="Click to toggle Paid/Due"
                      >
                        [{invoice.singleBillPaid || invoice.masterStatus === 'PAID' ? 'Paid' : 'Due'}]
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* 40% - 40% - 20% Milestone Schedule */
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="font-montserrat font-bold text-[11px] uppercase tracking-wider text-[#08221B] flex items-center gap-1.5 whitespace-nowrap">
                  <Layers className="w-3 h-3 text-[#08221B]" />
                  <span>PAYMENT SCHEDULE (40% — 40% — 20%)</span>
                </h2>
                <span className="font-poppins text-[9.5px] text-[#2C3330]/70 whitespace-nowrap">
                  Phased milestone delivery
                </span>
              </div>

              <table className="w-full text-left border-collapse text-xs font-poppins">
                <thead>
                  <tr className="bg-[#08221B] text-white font-montserrat text-[9px] uppercase tracking-wider">
                    <th className="py-2 px-3 w-20">PHASE</th>
                    <th className="py-2 px-3">MILESTONE</th>
                    <th className="py-2 px-3 text-center w-16">%</th>
                    <th className="py-2 px-3 text-right w-32">AMOUNT</th>
                    <th className="py-2 px-3 text-center w-24">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ACBEA3]/25">
                  {invoice.milestones.map((phase: MilestonePhase) => {
                    const isPaid = phase.status === 'PAID';
                    return (
                      <tr key={phase.phaseId} className="hover:bg-[#F8F4ED]/40">
                        <td className="py-2 px-3 font-medium text-[#08221B]">
                          Phase {phase.phaseId}
                        </td>
                        <td className="py-2 px-3 text-[#2C3330]">
                          {phase.name.split(':')[1]?.trim() || phase.name}
                        </td>
                        <td className="py-2 px-3 text-center text-[#2C3330] font-semibold">
                          {phase.percentage}%
                        </td>
                        <td className="py-2 px-3 text-right font-space-mono tabular-nums font-semibold text-[#08221B]">
                          {formatIndianCurrency(phase.amount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onMilestoneToggle?.(phase.phaseId)}
                            className={`cursor-pointer px-2 py-0.5 rounded text-[9.5px] font-poppins font-semibold transition-colors ${
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

        {/* PAYMENT DETAILS & Bank Settlement + Scannable QR Code + Authorized Signatory */}
        <div className="pt-3 border-t border-[#08221B]/15 grid grid-cols-2 gap-6 items-start text-xs font-poppins">
          {/* Left Column: Bank Details & UPI QR */}
          <div className="space-y-1.5">
            <span className="font-montserrat font-bold text-[10px] text-[#08221B] tracking-wider uppercase block">
              PAYMENT SETTLEMENT DETAILS
            </span>
            <div className="space-y-0.5 text-[#2C3330] text-[10.5px] leading-tight">
              <div>
                <span className="font-medium text-[#08221B]">Bank Name:</span>{' '}
                {invoice.bankDetails.bankName || studioConfig.bankName}
              </div>
              <div>
                <span className="font-medium text-[#08221B]">Account Name:</span>{' '}
                {invoice.bankDetails.accountName || studioConfig.accountName}
              </div>
              <div>
                <span className="font-medium text-[#08221B]">Account Number:</span>{' '}
                <span className="font-space-mono font-semibold text-[#08221B]">
                  {invoice.bankDetails.accountNumber || studioConfig.accountNumber}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#08221B]">IFSC Code:</span>{' '}
                <span className="font-space-mono font-semibold text-[#08221B]">
                  {invoice.bankDetails.ifscCode || studioConfig.ifscCode}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#08221B]">UPI ID:</span>{' '}
                <span className="font-space-mono font-semibold text-[#08221B]">
                  {invoice.bankDetails.upiId || studioConfig.upiId}
                </span>
              </div>
            </div>

            {/* Scannable UPI QR */}
            {qrDataUrl && (
              <div className="pt-1.5 flex items-center gap-2.5">
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  aria-describedby={qrDescId}
                  className="w-16 h-16 border border-[#ACBEA3] p-1 bg-white rounded-sm shrink-0"
                />
                <div id={qrDescId} className="text-[9.5px] text-[#2C3330] leading-tight">
                  <span className="font-montserrat font-bold block text-[#08221B] uppercase tracking-wide">
                    SCAN TO PAY VIA UPI
                  </span>
                  <span>Amount: {formatIndianCurrency(targetPaymentAmount)}</span>
                  <div className="text-[8.5px] text-[#2C3330]/70 mt-0.5">
                    Supports Google Pay, PhonePe, Paytm, BHIM
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1 text-[9.5px] text-[#2C3330]">
              <span className="font-semibold text-[#08221B]">ⓘ TERMS &amp; CONDITIONS</span>
              <p className="text-[8.5px] text-[#2C3330]/75 mt-0.5 line-clamp-2 leading-relaxed">
                {invoice.termsAndConditions || studioConfig.defaultTerms}
              </p>
            </div>
          </div>

          {/* Right Column: Authorized Signatory */}
          <div className="text-right space-y-10 pt-1 font-poppins flex flex-col justify-between h-full">
            <div className="font-montserrat font-bold text-[10.5px] text-[#08221B] uppercase tracking-wider">
              FOR INDIAN PIXEL
            </div>
            <div>
              <div className="border-b border-[#08221B] w-44 ml-auto mb-1"></div>
              <div className="text-[10.5px] font-semibold text-[#08221B]">
                Authorized Signatory
              </div>
              <div className="text-[9px] text-[#2C3330]/70">
                Design Studio Lead &amp; Principal
              </div>
            </div>
          </div>
        </div>

        {/* Document Footer: Strictly in ONE single pristine line */}
        <div className="mt-5 pt-3 border-t border-[#08221B]/15 text-center font-poppins text-[9.5px] text-[#2C3330]/75 whitespace-nowrap flex items-center justify-center gap-2">
          <span>Indian Pixel Graphic Design Solutions</span>
          <span className="text-[#ACBEA3]">·</span>
          <span>website-indianpixel.vercel.app</span>
          <span className="text-[#ACBEA3]">·</span>
          <span>theindianpixel@gmail.com</span>
          <span className="text-[#ACBEA3]">·</span>
          <span>+91 7585999426</span>
        </div>
      </div>
    </div>
  );
}
