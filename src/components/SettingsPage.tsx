import { useState, ChangeEvent, FormEvent } from 'react';
import type { StudioConfig } from '../types/invoice.ts';
import { BrandLogo } from './BrandLogo.tsx';
import {
  Building2,
  CreditCard,
  FileText,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  Lock,
  Download,
  ShieldCheck,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';

interface SettingsPageProps {
  config: StudioConfig;
  onSaveConfig: (updated: StudioConfig) => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onResetData: () => void;
  onLockStudio: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function SettingsPage({
  config,
  onSaveConfig,
  onExportBackup,
  onImportBackup,
  onResetData,
  onLockStudio,
  isDarkMode = true,
  onToggleDarkMode,
}: SettingsPageProps) {
  const [formData, setFormData] = useState<StudioConfig>({ ...config });
  const [logoPreview, setLogoPreview] = useState<string | undefined>(config.logoDataUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData((prev) => ({ ...prev, logoDataUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setLogoPreview(undefined);
    setFormData((prev) => ({ ...prev, logoDataUrl: undefined }));
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 font-poppins max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center p-2 shadow-md shrink-0 transition-colors ${
              isDarkMode
                ? 'bg-[#08221B] border border-[#ACBEA3]/40 shadow-[0_0_15px_rgba(172,190,163,0.15)]'
                : 'bg-[#08221B] border border-[#08221B]'
            }`}
          >
            <BrandLogo
              customLogoUrl={formData.logoDataUrl || logoPreview}
              size="sm"
              variant="icon"
              theme="white"
              withText={false}
            />
          </div>
          <div>
            <h2
              className={`text-xl font-bold font-montserrat tracking-tight transition-colors ${
                isDarkMode ? 'text-white' : 'text-[#08221B]'
              }`}
            >
              Studio Settings &amp; Configuration
            </h2>
            <p
              className={`text-xs mt-0.5 transition-colors ${
                isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/75'
              }`}
            >
              Manage Indian Pixel brand profile, GST registration status, bank settlement &amp; confidentiality.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onLockStudio}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold font-poppins transition-all cursor-pointer shadow-xs border ${
              isDarkMode
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                : 'bg-white hover:bg-[#F8F4ED] text-[#08221B] border-[#ACBEA3]/50'
            }`}
            title="Lock Studio (Require password to re-enter)"
          >
            <Lock className="w-3.5 h-3.5 text-[#FFA400]" />
            <span>Lock Studio</span>
          </button>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FFA400] hover:bg-[#e69400] text-[#08221B] font-montserrat font-bold text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Studio configurations and settings saved successfully!</span>
        </div>
      )}

      {/* Main Form Cards with Glassmorphism */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Brand & Logo Customization */}
        <div
          className={`p-6 rounded-2xl transition-all duration-200 space-y-4 border ${
            isDarkMode
              ? 'bg-[#18202F]/75 backdrop-blur-xl border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
              : 'bg-white/90 backdrop-blur-md border-[#ACBEA3]/40 shadow-xs'
          }`}
        >
          <div
            className={`flex items-center gap-2 pb-2 border-b ${
              isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/20'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#FFA400]" />
            <h3
              className={`font-montserrat font-bold text-sm ${
                isDarkMode ? 'text-white' : 'text-[#08221B]'
              }`}
            >
              Studio Identity &amp; Logo Assets
            </h3>
          </div>

          <div
            className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 border ${
              isDarkMode
                ? 'bg-white/[0.03] border-white/10'
                : 'bg-[#F8F4ED]/60 border-[#ACBEA3]/40'
            }`}
          >
            <div className="w-20 h-20 rounded-2xl bg-[#08221B] flex items-center justify-center p-3 shadow-md shrink-0 border border-[#ACBEA3]/30">
              <BrandLogo customLogoUrl={logoPreview} size="md" variant="icon" theme="white" withText={false} />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div
                className={`text-xs font-semibold ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                {logoPreview ? 'Custom Studio Logo Uploaded' : 'Indian Pixel 6-Blade Origami Aperture Brand Mark'}
              </div>
              <p
                className={`text-[11px] ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/70'
                }`}
              >
                This logo automatically renders across the sidebar, ledger headers, live bill preview, and printed PDF invoices.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="cursor-pointer px-3.5 py-1.5 bg-[#08221B] hover:bg-[#2C3330] text-xs font-semibold text-[#ACBEA3] rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm border border-[#ACBEA3]/30">
                  <Upload className="w-3.5 h-3.5 text-[#FFA400]" />
                  <span>Upload Logo (PNG/SVG)</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className={`px-3.5 py-1.5 text-xs rounded-xl transition-colors inline-flex items-center gap-1 border cursor-pointer ${
                      isDarkMode
                        ? 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                        : 'text-[#2C3330] hover:text-[#08221B] hover:bg-white border-[#ACBEA3]/60'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Origami</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Studio Profile Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                STUDIO NAME
              </label>
              <input
                type="text"
                value={formData.studioName}
                onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                OFFICIAL EMAIL
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                STUDIO PHONE
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                STUDIO WEBSITE
              </label>
              <input
                type="text"
                value={formData.web}
                onChange={(e) => setFormData({ ...formData, web: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                OFFICIAL STUDIO ADDRESS (OPTIONAL — ONLINE STUDIO)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Studio operates 100% online (no physical address)"
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white placeholder-slate-500 focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] placeholder-[#2C3330]/40 focus:border-[#08221B]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Card 2: GST Registration & Section 22 Exemption Status */}
        <div
          className={`p-6 rounded-2xl transition-all duration-200 space-y-4 border ${
            isDarkMode
              ? 'bg-[#18202F]/75 backdrop-blur-xl border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
              : 'bg-white/90 backdrop-blur-md border-[#ACBEA3]/40 shadow-xs'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-2 border-b ${
              isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FFA400]" />
              <h3
                className={`font-montserrat font-bold text-sm ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                GST Registration &amp; Exemption Status
              </h3>
            </div>
            <span
              className={`text-[10px] font-space-mono font-bold px-2 py-0.5 rounded border ${
                isDarkMode
                  ? 'bg-white/10 text-[#ACBEA3] border-white/10'
                  : 'bg-[#F8F4ED] text-[#08221B] border-[#ACBEA3]/40'
              }`}
            >
              CGST Act, 2017
            </span>
          </div>

          <div
            className={`p-4 rounded-2xl space-y-3 border ${
              isDarkMode
                ? 'bg-white/[0.03] border-white/10'
                : 'bg-[#F8F4ED] border-[#ACBEA3]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`text-xs font-montserrat font-bold block ${
                    isDarkMode ? 'text-white' : 'text-[#08221B]'
                  }`}
                >
                  GST REGIME SELECTION
                </span>
                <span
                  className={`text-[11px] ${
                    isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/75'
                  }`}
                >
                  Toggle whether Indian Pixel levies GST or operates as exempt under statutory threshold
                </span>
              </div>

              <label
                className={`flex items-center gap-2 cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                  isDarkMode
                    ? 'bg-white/10 text-white border-white/15'
                    : 'bg-white text-[#08221B] border-[#ACBEA3]/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.isGstRegistered}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isGstRegistered: e.target.checked,
                      gstin: e.target.checked ? '' : 'Unregistered / Exempt under Section 22 of CGST Act',
                    })
                  }
                  className="accent-[#FFA400] w-4 h-4 cursor-pointer"
                />
                <span>GST Registered Entity</span>
              </label>
            </div>

            {!formData.isGstRegistered ? (
              <div
                className={`p-3 rounded-xl space-y-1 border ${
                  isDarkMode
                    ? 'bg-white/[0.05] border-white/10'
                    : 'bg-white border-[#ACBEA3]/50'
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    isDarkMode ? 'text-white' : 'text-[#08221B]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFA400]" />
                  <span>GST Status: Unregistered / Exempt under Section 22 of CGST Act</span>
                </div>
                <p
                  className={`text-[11px] leading-relaxed font-poppins ${
                    isDarkMode ? 'text-slate-300' : 'text-[#2C3330]/80'
                  }`}
                >
                  Indian Pixel operates within statutory turnover threshold exemption limits (e.g. ₹20 Lakhs). All generated bills will display "Bill of Supply (Exempt u/s 22 CGST Act)" without charging GST tax until you register and check this box.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <label
                  className={`block text-[10px] font-montserrat font-bold mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                  }`}
                >
                  OFFICIAL GSTIN (15 DIGITS)
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="e.g. 07AABCU9603R1ZX"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-space-mono outline-none ${
                    isDarkMode
                      ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                      : 'bg-white border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                  }`}
                />
              </div>
            )}

            <div className="pt-2 border-t border-white/10">
              <label
                className={`block text-[10px] font-montserrat font-bold mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                PERMANENT ACCOUNT NUMBER (PAN)
              </label>
              <input
                type="text"
                value={formData.pan || ''}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="e.g. KJKPD8069P"
                className={`w-full px-3 py-2 rounded-xl text-xs font-space-mono outline-none uppercase ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-white border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
              <span className={`text-[10px] block mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'}`}>
                Renders on official invoice headers as PAN: KJKPD8069P · Tax Status: GST Exempt (Sec 22, CGST Act)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Bank Settlement & UPI Account */}
        <div
          className={`p-6 rounded-2xl transition-all duration-200 space-y-4 border ${
            isDarkMode
              ? 'bg-[#18202F]/75 backdrop-blur-xl border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
              : 'bg-white/90 backdrop-blur-md border-[#ACBEA3]/40 shadow-xs'
          }`}
        >
          <div
            className={`flex items-center gap-2 pb-2 border-b ${
              isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/20'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#FFA400]" />
            <h3
              className={`font-montserrat font-bold text-sm ${
                isDarkMode ? 'text-white' : 'text-[#08221B]'
              }`}
            >
              Default Bank Settlement &amp; UPI QR Account
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                BANK NAME
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                ACCOUNT HOLDER / PAYEE
              </label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                ACCOUNT NUMBER
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-space-mono outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                IFSC CODE
              </label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-space-mono uppercase outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                className={`block text-[10px] font-montserrat font-bold uppercase mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#2C3330]'
                }`}
              >
                UPI ID (AUTONOMOUS QR CODE GENERATOR)
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-space-mono outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.05] border border-white/15 text-white focus:border-[#FFA400]'
                    : 'bg-[#F8F4ED] border border-[#ACBEA3]/40 text-[#08221B] focus:border-[#08221B]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Dark Mode Feature Toggle */}
        <div
          className={`p-6 rounded-2xl transition-all duration-200 space-y-4 border ${
            isDarkMode
              ? 'bg-[#18202F]/75 backdrop-blur-xl border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
              : 'bg-white/90 backdrop-blur-md border-[#ACBEA3]/40 shadow-xs'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-2 border-b ${
              isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#FFA400]" />
              <h3
                className={`font-montserrat font-bold text-sm ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                Interface Appearance &amp; Dark Mode
              </h3>
            </div>
            <span
              className={`text-[10px] font-space-mono font-bold px-2 py-0.5 rounded border ${
                isDarkMode
                  ? 'bg-white/10 text-[#ACBEA3] border-white/10'
                  : 'bg-[#F8F4ED] text-[#08221B] border-[#ACBEA3]/40'
              }`}
            >
              {isDarkMode ? 'Dark Mode Active' : 'Warm Linen Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => onToggleDarkMode && (!isDarkMode ? onToggleDarkMode() : null)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                isDarkMode
                  ? 'bg-[#121622] text-white border-[#FFA400]/60 shadow-lg ring-2 ring-[#FFA400]/40'
                  : 'bg-white/60 text-[#2C3330] border-[#ACBEA3]/40 hover:bg-[#F8F4ED]'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#282b36] text-[#FFA400] flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-montserrat font-bold text-sm">
                    Dark Obsidian Studio
                  </span>
                  {isDarkMode && (
                    <span className="text-[10px] font-semibold bg-[#FFA400] text-[#08221B] px-1.5 py-0.2 rounded font-space-mono">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-75">
                  Deep slate &amp; obsidian luxury interface with glassmorphism and reduced eye fatigue during night drafting.
                </p>
              </div>
            </button>

            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => onToggleDarkMode && (isDarkMode ? onToggleDarkMode() : null)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                !isDarkMode
                  ? 'bg-[#08221B] text-white border-[#08221B] shadow-md ring-2 ring-[#FFA400]/40'
                  : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#FFA400] text-[#08221B] flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-montserrat font-bold text-sm">
                    Warm Emerald Linen
                  </span>
                  {!isDarkMode && (
                    <span className="text-[10px] font-semibold bg-[#FFA400] text-[#08221B] px-1.5 py-0.2 rounded font-space-mono">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-75">
                  Signature Indian Pixel warmth with forest green, natural linen background and sage borders.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Card 5: Confidentiality Protection & Data Workflow */}
        <div
          className={`p-6 rounded-2xl transition-all duration-200 space-y-4 border ${
            isDarkMode
              ? 'bg-[#18202F]/75 backdrop-blur-xl border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
              : 'bg-white/90 backdrop-blur-md border-[#ACBEA3]/40 shadow-xs'
          }`}
        >
          <div
            className={`flex items-center gap-2 pb-2 border-b ${
              isDarkMode ? 'border-white/10' : 'border-[#ACBEA3]/20'
            }`}
          >
            <Lock className="w-4 h-4 text-[#FFA400]" />
            <h3
              className={`font-montserrat font-bold text-sm ${
                isDarkMode ? 'text-white' : 'text-[#08221B]'
              }`}
            >
              Confidentiality &amp; Data Workflow
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={onExportBackup}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 ${
                isDarkMode
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                  : 'bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 border-[#ACBEA3]/50'
              }`}
            >
              <Download className={`w-4 h-4 ${isDarkMode ? 'text-[#ACBEA3]' : 'text-[#08221B]'}`} />
              <div
                className={`text-xs font-bold font-montserrat ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                Export Backup
              </div>
              <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'}`}>
                Download full JSON ledger backup
              </div>
            </button>

            <button
              type="button"
              onClick={onImportBackup}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 ${
                isDarkMode
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                  : 'bg-[#F8F4ED] hover:bg-[#ACBEA3]/30 border-[#ACBEA3]/50'
              }`}
            >
              <Upload className={`w-4 h-4 ${isDarkMode ? 'text-[#ACBEA3]' : 'text-[#08221B]'}`} />
              <div
                className={`text-xs font-bold font-montserrat ${
                  isDarkMode ? 'text-white' : 'text-[#08221B]'
                }`}
              >
                Restore Backup
              </div>
              <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-[#2C3330]/70'}`}>
                Upload previously saved JSON file
              </div>
            </button>

            <button
              type="button"
              onClick={onResetData}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 ${
                isDarkMode
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30'
                  : 'bg-rose-50 hover:bg-rose-100 border-red-200'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <div className="text-xs font-bold text-rose-400 font-montserrat">Reset Data to ₹0.00</div>
              <div className={`text-[10px] ${isDarkMode ? 'text-rose-300/70' : 'text-red-600/70'}`}>
                Purge custom test invoices
              </div>
            </button>
          </div>

          <div
            className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
              isDarkMode
                ? 'bg-white/[0.03] border-white/10 text-slate-300'
                : 'bg-[#F8F4ED] border-[#ACBEA3]/40 text-[#2C3330]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFA400]" />
              <span>Workspace protected by password <strong>"12345678"</strong></span>
            </div>
            <button
              type="button"
              onClick={onLockStudio}
              className={`font-bold hover:underline cursor-pointer ${
                isDarkMode ? 'text-[#FFA400]' : 'text-[#08221B]'
              }`}
            >
              Lock Now
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFA400] hover:bg-[#e69400] text-[#08221B] font-montserrat font-bold text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Studio Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
}
