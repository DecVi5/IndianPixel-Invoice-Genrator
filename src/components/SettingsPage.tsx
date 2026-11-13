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
  Cloud,
  RefreshCw,
  Trash2,
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
  // Google Drive Cloud Persistence Props
  driveConnected?: boolean;
  driveUserEmail?: string | null;
  driveFileName?: string | null;
  driveLastSynced?: string | null;
  isDriveSyncing?: boolean;
  onConnectGoogleDrive?: () => void;
  onSyncToGoogleDrive?: () => void;
  onRestoreFromGoogleDrive?: () => void;
  onDeleteFromGoogleDrive?: () => void;
  onDisconnectGoogleDrive?: () => void;
}

export function SettingsPage({
  config,
  onSaveConfig,
  onExportBackup,
  onImportBackup,
  onResetData,
  onLockStudio,
  isDarkMode = true,
  driveConnected = false,
  driveUserEmail = null,
  driveFileName = null,
  driveLastSynced = null,
  isDriveSyncing = false,
  onConnectGoogleDrive,
  onSyncToGoogleDrive,
  onRestoreFromGoogleDrive,
  onDeleteFromGoogleDrive,
  onDisconnectGoogleDrive,
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
    <div className="w-full space-y-7 pb-14 font-poppins">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <BrandLogo
            customLogoUrl={formData.logoDataUrl || logoPreview}
            size="md"
            variant="icon"
            theme="white"
            withText={false}
          />
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

        {/* Card 4: Financial Goal Target & Dark Studio Theme */}
        <div className="p-6 rounded-2xl transition-all duration-200 space-y-4 border bg-[#08221B] border-[#ACBEA3]/25 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#ACBEA3]/20">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#FFA400]" />
              <h3 className="font-montserrat font-bold text-sm text-[#F8F4ED]">
                Financial Goal Target &amp; Dark Studio Theme
              </h3>
            </div>
            <span className="text-[10px] font-space-mono font-bold px-2 py-0.5 rounded border bg-[#2C3330] text-[#FFA400] border-[#ACBEA3]/30">
              Dark Mode Locked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#2C3330] border border-[#ACBEA3]/30 space-y-2">
              <label className="block text-[10px] font-montserrat font-bold uppercase text-[#ACBEA3]">
                TARGET FINANCIAL GOAL (₹) — REDUCED PER TRANSACTION
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={formData.financialGoal ?? 500000}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    financialGoal: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#08221B] border border-[#ACBEA3]/40 text-xs font-space-mono font-bold text-[#F8F4ED] focus:border-[#FFA400] outline-none"
              />
              <p className="text-[11px] text-[#ACBEA3]">
                Displayed at the top of the workspace. Every generated invoice transaction automatically reduces the remaining goal balance.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#2C3330] text-[#F8F4ED] border border-[#FFA400]/50 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#08221B] border border-[#ACBEA3]/30 text-[#FFA400] flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-montserrat font-bold text-sm">
                    Dark Midnight Studio
                  </span>
                  <span className="text-[10px] font-semibold bg-[#FFA400] text-[#08221B] px-1.5 py-0.2 rounded font-space-mono">
                    Locked Active
                  </span>
                </div>
                <p className="text-xs text-[#ACBEA3]">
                  Permanent dark theme (#08221B Midnight Green &amp; #2C3330 Gunmetal) active across all dashboards, editors, and modals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Google Drive Cloud Persistence & Deployment Sync */}
        <div className="p-6 rounded-2xl transition-all duration-200 space-y-4 border bg-[#08221B] border-[#FFA400]/40 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#ACBEA3]/20">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#FFA400]" />
              <h3 className="font-montserrat font-bold text-sm text-[#F8F4ED]">
                Google Drive Cloud Persistence
              </h3>
            </div>
            <span
              className={`text-[10px] font-space-mono font-bold px-2.5 py-0.5 rounded border ${
                driveConnected
                  ? 'bg-[#FFA400]/20 text-[#FFA400] border-[#FFA400]/50'
                  : 'bg-[#2C3330] text-[#ACBEA3] border-[#ACBEA3]/30'
              }`}
            >
              {driveConnected ? 'Connected to Google Drive' : 'Not Connected'}
            </span>
          </div>

          {!driveConnected ? (
            <div className="p-4 rounded-2xl bg-[#2C3330] border border-[#ACBEA3]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-montserrat font-bold text-[#F8F4ED]">
                  Persist Invoices &amp; Studio Settings in Google Drive
                </div>
                <p className="text-[11px] text-[#ACBEA3] leading-relaxed">
                  Connect your Google account so your invoices, financial goals, and studio configuration are saved to <span className="font-space-mono text-[#F8F4ED]">indian-pixel-studio-ledger.json</span> in your Google Drive across sessions and deployments.
                </p>
              </div>

              <button
                type="button"
                onClick={onConnectGoogleDrive}
                disabled={isDriveSyncing}
                className="gsi-material-button shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8F4ED] text-[#08221B] font-poppins font-semibold text-xs flex items-center gap-2.5 shadow-md transition-all cursor-pointer"
              >
                <div className="gsi-material-button-icon w-4 h-4 shrink-0">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">Sign in with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#2C3330] border border-[#ACBEA3]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="text-[#ACBEA3]">
                    Connected Account:{' '}
                    <strong className="font-space-mono text-[#F8F4ED]">
                      {driveUserEmail || 'Google Workspace Account'}
                    </strong>
                  </div>
                  <div className="text-[#ACBEA3]">
                    Drive Ledger File:{' '}
                    <span className="font-space-mono text-[#FFA400]">
                      {driveFileName || 'indian-pixel-studio-ledger.json'}
                    </span>
                    {driveLastSynced ? ` · Last Synced: ${driveLastSynced}` : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onDisconnectGoogleDrive}
                  className="px-3 py-1.5 rounded-xl bg-[#08221B] hover:bg-rose-950/40 border border-[#ACBEA3]/30 text-rose-300 text-xs font-medium cursor-pointer"
                >
                  Disconnect
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={onSyncToGoogleDrive}
                  disabled={isDriveSyncing}
                  className="p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 bg-[#2C3330] hover:bg-[#363e3b] border-[#FFA400]/50"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#FFA400] ${isDriveSyncing ? 'animate-spin' : ''}`}
                  />
                  <div className="text-xs font-bold font-montserrat text-[#F8F4ED]">
                    Sync Ledger to Drive
                  </div>
                  <div className="text-[10px] text-[#ACBEA3]">
                    Save current invoices &amp; config to Drive
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onRestoreFromGoogleDrive}
                  disabled={isDriveSyncing}
                  className="p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 bg-[#2C3330] hover:bg-[#363e3b] border-[#ACBEA3]/30"
                >
                  <Download className="w-4 h-4 text-[#ACBEA3]" />
                  <div className="text-xs font-bold font-montserrat text-[#F8F4ED]">
                    Restore from Drive
                  </div>
                  <div className="text-[10px] text-[#ACBEA3]">
                    Load saved ledger from Google Drive
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onDeleteFromGoogleDrive}
                  disabled={isDriveSyncing}
                  className="p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <div className="text-xs font-bold text-rose-400 font-montserrat">
                    Delete Cloud File
                  </div>
                  <div className="text-[10px] text-rose-300/70">
                    Remove backup file from Google Drive
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card 6: Confidentiality Protection & Data Workflow */}
        <div className="p-6 rounded-2xl transition-all duration-200 space-y-4 border bg-[#08221B] border-[#ACBEA3]/25 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-[#ACBEA3]/20">
            <Lock className="w-4 h-4 text-[#FFA400]" />
            <h3 className="font-montserrat font-bold text-sm text-[#F8F4ED]">
              Confidentiality &amp; Data Workflow
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={onExportBackup}
              className="p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 bg-[#2C3330] hover:bg-[#363e3b] border-[#ACBEA3]/30"
            >
              <Download className="w-4 h-4 text-[#FFA400]" />
              <div className="text-xs font-bold font-montserrat text-[#F8F4ED]">
                Export Backup
              </div>
              <div className="text-[10px] text-[#ACBEA3]">
                Download full JSON ledger backup
              </div>
            </button>

            <button
              type="button"
              onClick={onImportBackup}
              className="p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 bg-[#2C3330] hover:bg-[#363e3b] border-[#ACBEA3]/30"
            >
              <Upload className="w-4 h-4 text-[#ACBEA3]" />
              <div className="text-xs font-bold font-montserrat text-[#F8F4ED]">
                Restore Backup
              </div>
              <div className="text-[10px] text-[#ACBEA3]">
                Upload previously saved JSON file
              </div>
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <div className="text-xs font-bold text-rose-400 font-montserrat">Reset Data to ₹0.00</div>
              <div className="text-[10px] text-rose-300/70">
                Purge custom test invoices
              </div>
            </button>
          </div>

          <div className="p-3 rounded-xl flex items-center justify-between text-xs border bg-[#2C3330] border-[#ACBEA3]/30 text-[#ACBEA3]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFA400]" />
              <span>Authorized accounts: <strong className="text-[#F8F4ED]">admin@indianpixel.in</strong> &amp; <strong className="text-[#F8F4ED]">cfo@indianpixel.in</strong></span>
            </div>
            <button
              type="button"
              onClick={onLockStudio}
              className="font-bold hover:underline cursor-pointer text-[#FFA400]"
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
