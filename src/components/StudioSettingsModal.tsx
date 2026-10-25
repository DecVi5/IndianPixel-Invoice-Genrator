import { useState, ChangeEvent } from 'react';
import { StudioConfig } from '../types/invoice.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { X, Save, Upload, RotateCcw, Building, CreditCard, FileCheck } from 'lucide-react';

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StudioConfig;
  onSaveConfig: (newConfig: StudioConfig) => void;
}

export function StudioSettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}: StudioSettingsModalProps) {
  const [formData, setFormData] = useState<StudioConfig>({ ...config });
  const [logoPreview, setLogoPreview] = useState<string | undefined>(config.logoDataUrl);

  if (!isOpen) return null;

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setFormData((prev) => ({ ...prev, logoDataUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setLogoPreview(undefined);
    setFormData((prev) => ({ ...prev, logoDataUrl: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print font-poppins">
      <div className="bg-white border border-[#ACBEA3]/50 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ACBEA3]/20 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold font-montserrat text-[#08221B] tracking-tight">
              Studio Configuration &amp; Branding
            </h2>
            <p className="text-xs text-[#2C3330]/70">
              Settings persist across all new and exported invoices.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#2C3330]/70 hover:text-[#08221B] rounded-full hover:bg-[#F8F4ED] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Logo & Brand Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#ACBEA3]/20 text-xs font-bold font-montserrat text-[#08221B]">
              <Building className="w-4 h-4 text-[#FFA400]" />
              <span>Studio Brand Mark</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-2xl">
              <div className="w-16 h-16 flex items-center justify-center bg-[#08221B] border border-[#ACBEA3]/40 rounded-2xl p-2.5 shrink-0 shadow-md">
                <BrandLogo customLogoUrl={logoPreview} size="md" variant="icon" theme="white" withText={false} />
              </div>

              <div className="flex-1 space-y-2">
                <div className="text-xs text-[#08221B] font-semibold">
                  {logoPreview ? 'Custom Studio Logo Uploaded' : 'Indian Pixel Geometric Star Mark'}
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3.5 py-1.5 bg-[#08221B] hover:bg-[#2C3330] text-xs font-semibold text-white rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo (PNG/SVG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="px-3.5 py-1.5 text-xs text-[#2C3330] hover:text-[#08221B] hover:bg-white rounded-xl transition-colors inline-flex items-center gap-1 border border-[#ACBEA3]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Studio Profile */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  STUDIO NAME
                </label>
                <input
                  type="text"
                  value={formData.studioName}
                  onChange={(e) =>
                    setFormData({ ...formData, studioName: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  OFFICIAL EMAIL
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  STUDIO PHONE
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  STUDIO WEBSITE
                </label>
                <input
                  type="text"
                  value={formData.web}
                  onChange={(e) =>
                    setFormData({ ...formData, web: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  OFFICIAL ADDRESS (OPTIONAL — ONLINE STUDIO)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Studio operates 100% online (no physical address)"
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none placeholder-[#2C3330]/40"
                />
              </div>
            </div>

            {/* GSTIN Configuration */}
            <div className="p-3.5 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-montserrat font-bold text-[#08221B]">
                  GST REGISTRATION STATUS
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#2C3330]">
                  <input
                    type="checkbox"
                    checked={formData.isGstRegistered}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isGstRegistered: e.target.checked,
                      })
                    }
                    className="accent-[#08221B]"
                  />
                  <span>GST Registered Entity</span>
                </label>
              </div>

              {!formData.isGstRegistered ? (
                <div className="p-2.5 bg-white/80 border border-[#ACBEA3]/50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#08221B]">
                    <span className="w-2 h-2 rounded-full bg-[#FFA400]"></span>
                    <span>GST Status: Unregistered / Exempt under Section 22 of CGST Act</span>
                  </div>
                  <p className="text-[10.5px] text-[#2C3330]/80 leading-relaxed font-poppins">
                    Indian Pixel operates within statutory turnover threshold exemption limits. Invoices are issued as exempt without collecting GST until you update this setting.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] mb-1">
                    STUDIO GSTIN NUMBER
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) =>
                      setFormData({ ...formData, gstin: e.target.value })
                    }
                    placeholder="e.g. 07AABCU9603R1ZX"
                    className="w-full px-3 py-1.5 bg-white border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-[#ACBEA3]/30">
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] mb-1">
                  PERMANENT ACCOUNT NUMBER (PAN)
                </label>
                <input
                  type="text"
                  value={formData.pan || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, pan: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. KJKPD8069P"
                  className="w-full px-3 py-1.5 bg-white border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Settlement Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#ACBEA3]/20 text-xs font-bold font-montserrat text-[#08221B]">
              <CreditCard className="w-4 h-4 text-[#FFA400]" />
              <span>Default Settlement &amp; UPI Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  BANK NAME
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  ACCOUNT NAME
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  ACCOUNT NUMBER
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  IFSC CODE
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) =>
                    setFormData({ ...formData, ifscCode: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-montserrat font-bold text-[#2C3330] uppercase mb-1">
                  UPI ID (VPA) FOR SCANNABLE QR
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) =>
                    setFormData({ ...formData, upiId: e.target.value })
                  }
                  placeholder="theindianpixel@okaxis"
                  className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs font-space-mono text-[#08221B] focus:border-[#08221B] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Default Terms */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-[#ACBEA3]/20 text-xs font-bold font-montserrat text-[#08221B]">
              <FileCheck className="w-4 h-4 text-[#FFA400]" />
              <span>Standard Contractual Terms</span>
            </div>
            <textarea
              rows={3}
              value={formData.defaultTerms}
              onChange={(e) =>
                setFormData({ ...formData, defaultTerms: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F8F4ED] border border-[#ACBEA3]/40 rounded-xl text-xs text-[#2C3330] focus:border-[#08221B] outline-none resize-none font-poppins"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ACBEA3]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#2C3330] hover:text-[#08221B] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold font-montserrat text-[#08221B] bg-[#FFA400] hover:bg-[#e69400] rounded-xl transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Studio Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
