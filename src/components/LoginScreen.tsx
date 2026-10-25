import { useState, FormEvent } from 'react';
import { BrandLogo } from './BrandLogo.tsx';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  Lock,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  logoDataUrl?: string;
}

export function LoginScreen({ onLoginSuccess, logoDataUrl }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [studioUser, setStudioUser] = useState('Director / Lead');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: 'Capturing Visions, Architecting Identities',
      subtitle: 'Dynamic branding systems, high-touch typography & motion guidelines',
      tag: 'Creative Direction',
    },
    {
      title: 'Precision Invoicing & Split Milestones',
      subtitle: 'Streamlined client disbursements, statutory PAN & Sec 22 compliance',
      tag: 'Financial Suite',
    },
    {
      title: 'Capturing Moments, Creating Memories',
      subtitle: 'Indian Pixel Studio executive digital ledger & real-time analytics',
      tag: 'Studio Ledger',
    },
  ];

  const handleUnlock = (pwdToTest = password) => {
    setIsSubmitting(true);
    setError(null);

    // Confidential password is "12345678"
    if (pwdToTest === '12345678') {
      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess();
      }, 350);
    } else {
      setTimeout(() => {
        setIsSubmitting(false);
        setError('Incorrect access password. Enter "12345678" to unlock.');
      }, 250);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleUnlock(password);
  };

  const handleFastUnlock = () => {
    setPassword('12345678');
    handleUnlock('12345678');
  };

  return (
    <div className="min-h-screen w-full bg-[#2C3330] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-poppins relative overflow-hidden select-none">
      {/* Ambient background glows using Midnight Green & Camouflage Green */}
      <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-[#08221B]/60 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[650px] h-[650px] rounded-full bg-[#ACBEA3]/15 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full bg-[#08221B]/40 blur-[180px] pointer-events-none" />

      {/* Main Glassmorphic Split Authentication Card */}
      <div className="w-full max-w-[1080px] bg-[#08221B]/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[36px] border border-[#ACBEA3]/25 shadow-[0_30px_90px_rgba(0,0,0,0.65)] p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-stretch relative z-10">
        
        {/* LEFT COLUMN: Serene Emerald Forest & Dunes Vector Graphic Panel */}
        <div className="lg:col-span-5 rounded-[24px] sm:rounded-[28px] overflow-hidden relative flex flex-col justify-between p-6 sm:p-8 min-h-[420px] lg:min-h-[580px] shadow-2xl border border-[#ACBEA3]/20">
          {/* Silky Dunes & Forest Vector Landscape in Indian Pixel Palette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#08221B] via-[#113128] to-[#041510] z-0">
            <svg
              className="absolute inset-0 w-full h-full object-cover"
              viewBox="0 0 500 700"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="emeraldSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#143b31" />
                  <stop offset="35%" stopColor="#0d2e26" />
                  <stop offset="70%" stopColor="#08221B" />
                  <stop offset="100%" stopColor="#041510" />
                </linearGradient>
                <linearGradient id="duneFarGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#255749" />
                  <stop offset="50%" stopColor="#174438" />
                  <stop offset="100%" stopColor="#0c2b23" />
                </linearGradient>
                <linearGradient id="duneMidGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2d6858" />
                  <stop offset="45%" stopColor="#1b4d3f" />
                  <stop offset="100%" stopColor="#0e2f26" />
                </linearGradient>
                <linearGradient id="duneFrontGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#357866" />
                  <stop offset="60%" stopColor="#18483b" />
                  <stop offset="100%" stopColor="#08221B" />
                </linearGradient>
                <radialGradient id="emeraldGlow" cx="50%" cy="25%" r="65%">
                  <stop offset="0%" stopColor="#ACBEA3" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#08221B" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#041510" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="500" height="700" fill="url(#emeraldSky)" />
              <rect width="500" height="700" fill="url(#emeraldGlow)" />

              {/* Distant soft aurora bands */}
              <path
                d="M-20 170 C 90 140, 200 180, 310 155 C 390 140, 450 165, 520 150 L 520 230 L -20 230 Z"
                fill="#1f4e42"
                opacity="0.3"
              />
              <path
                d="M-20 215 C 110 190, 240 220, 360 195 C 430 180, 480 205, 520 200 L 520 270 L -20 270 Z"
                fill="#133d33"
                opacity="0.4"
              />

              {/* Far Dune */}
              <path
                d="M -10 320 Q 160 240, 330 360 Q 420 420, 510 380 L 510 710 L -10 710 Z"
                fill="url(#duneFarGreen)"
              />

              {/* Mid Ridge with subtle Camouflage Green contour */}
              <path
                d="M -10 435 Q 180 310, 380 480 Q 450 540, 510 510 L 510 710 L -10 710 Z"
                fill="url(#duneMidGreen)"
              />

              {/* Front sweeping Dune with deep midnight green base */}
              <path
                d="M -10 550 Q 150 420, 310 560 Q 410 640, 510 600 L 510 710 L -10 710 Z"
                fill="url(#duneFrontGreen)"
              />
            </svg>
            {/* Fine frosted dark vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#041510]/50 pointer-events-none" />
          </div>

          {/* Top Bar of Left Panel: Company Brand Logo & "Back to website" */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Company Logo Placed on Top-Left */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#08221B]/95 border border-[#ACBEA3]/40 flex items-center justify-center p-1 shadow-md backdrop-blur-md">
                <BrandLogo
                  customLogoUrl={logoDataUrl}
                  size="sm"
                  variant="icon"
                  theme="white"
                  withText={false}
                />
              </div>
              <div>
                <span className="font-montserrat font-bold text-base tracking-tight text-[#F8F4ED] drop-shadow-sm block">
                  Indian Pixel
                </span>
                <span className="text-[10px] text-[#ACBEA3] font-space-mono font-medium block -mt-0.5">
                  Design Studio
                </span>
              </div>
            </div>

            {/* Back to website Apple-style pill button */}
            <a
              href="https://website-indianpixel.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2C3330]/70 hover:bg-[#2C3330] backdrop-blur-md border border-[#ACBEA3]/30 text-[11px] font-medium text-[#F8F4ED] transition-all shadow-xs cursor-pointer hover:border-[#FFA400]"
            >
              <span>Back to website</span>
              <ArrowRight className="w-3 h-3 text-[#FFA400]" />
            </a>
          </div>

          {/* Bottom Area of Left Panel: Slide Copy & Carousel Indicators */}
          <div className="relative z-10 space-y-4 pt-12">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ACBEA3]/15 border border-[#ACBEA3]/30 text-[10px] font-semibold text-[#FFA400] font-space-mono uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#FFA400]" />
              <span>{slides[activeSlide]?.tag}</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-medium font-sans tracking-tight text-[#F8F4ED] drop-shadow-md leading-tight">
                {slides[activeSlide]?.title}
              </h2>
              <p className="text-xs text-[#ACBEA3] font-poppins leading-relaxed">
                {slides[activeSlide]?.subtitle}
              </p>
            </div>

            {/* Apple HIG Carousel navigation indicator pills */}
            <div className="flex items-center gap-2 pt-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === idx
                      ? 'w-8 bg-[#FFA400] shadow-[0_0_10px_rgba(255,164,0,0.6)]'
                      : 'w-3 bg-[#F8F4ED]/25 hover:bg-[#F8F4ED]/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Apple Human Interface Form Panel */}
        <div className="lg:col-span-7 flex flex-col justify-center px-3 sm:px-6 lg:px-8 py-3 sm:py-5 text-[#F8F4ED] space-y-5">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFA400] shadow-[0_0_8px_#FFA400]" />
              <span className="text-[11px] font-space-mono uppercase tracking-wider text-[#ACBEA3] font-semibold">
                Studio Executive Suite
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8F4ED] font-sans">
              Sign in to Studio Portal
            </h1>
            <p className="text-xs text-[#ACBEA3] font-poppins flex items-center gap-2 flex-wrap">
              <span>Confidential financial portal.</span>
              <button
                type="button"
                onClick={handleFastUnlock}
                className="inline-flex items-center gap-1 text-[#FFA400] hover:text-[#ffb732] font-medium underline underline-offset-2 cursor-pointer transition-colors"
              >
                <span>Quick Unlock (12345678)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Row 1: Studio User & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#ACBEA3] block">
                  Director / User Role
                </label>
                <input
                  type="text"
                  value={studioUser}
                  onChange={(e) => setStudioUser(e.target.value)}
                  placeholder="Director / Lead"
                  className="w-full px-3.5 py-2.5 bg-[#2C3330] hover:bg-[#2C3330]/90 focus:bg-[#2C3330] border border-[#ACBEA3]/30 focus:border-[#FFA400] focus:ring-1 focus:ring-[#FFA400]/40 rounded-xl text-xs sm:text-sm text-[#F8F4ED] placeholder-[#ACBEA3]/50 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#ACBEA3] block">
                  Studio Unit
                </label>
                <input
                  type="text"
                  defaultValue="Indian Pixel Studio"
                  placeholder="Studio Unit"
                  className="w-full px-3.5 py-2.5 bg-[#2C3330]/70 hover:bg-[#2C3330] focus:bg-[#2C3330] border border-[#ACBEA3]/30 focus:border-[#FFA400] focus:ring-1 focus:ring-[#FFA400]/40 rounded-xl text-xs sm:text-sm text-[#F8F4ED] placeholder-[#ACBEA3]/50 outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 2: Email input */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#ACBEA3] block">
                Executive Email
              </label>
              <input
                type="email"
                defaultValue="theindianpixel@gmail.com"
                placeholder="theindianpixel@gmail.com"
                className="w-full px-3.5 py-2.5 bg-[#2C3330] hover:bg-[#2C3330]/90 focus:bg-[#2C3330] border border-[#ACBEA3]/30 focus:border-[#FFA400] focus:ring-1 focus:ring-[#FFA400]/40 rounded-xl text-xs sm:text-sm text-[#F8F4ED] placeholder-[#ACBEA3]/50 outline-none transition-all"
              />
            </div>

            {/* Row 3: Password input with eye toggle */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#ACBEA3] block">
                Access Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter password (default: 12345678)"
                  autoFocus
                  required
                  className={`w-full pl-3.5 pr-11 py-2.5 bg-[#2C3330] hover:bg-[#2C3330]/90 focus:bg-[#2C3330] border rounded-xl text-xs sm:text-sm font-space-mono text-[#F8F4ED] placeholder-[#ACBEA3]/50 outline-none transition-all ${
                    error
                      ? 'border-red-400 bg-red-950/20'
                      : 'border-[#ACBEA3]/30 focus:border-[#FFA400] focus:ring-1 focus:ring-[#FFA400]/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ACBEA3] hover:text-[#FFA400] p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-rose-300 font-poppins pt-1 pl-1 animate-in fade-in">
                  {error}
                </p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => setAgreeTerms(!agreeTerms)}
                className={`w-4 h-4 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  agreeTerms
                    ? 'bg-[#FFA400] text-[#08221B]'
                    : 'border border-[#ACBEA3]/40 bg-[#2C3330]'
                }`}
              >
                {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <span className="text-[11px] text-[#ACBEA3] font-poppins">
                I agree to the{' '}
                <span className="text-[#F8F4ED] hover:text-[#FFA400] hover:underline cursor-pointer">
                  Confidential Terms &amp; Conditions
                </span>
              </span>
            </div>

            {/* Apple HIG Clean Primary Button in Amber Yellow CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#FFA400] hover:bg-[#ffb424] active:bg-[#e69300] text-[#08221B] font-poppins font-bold text-xs sm:text-sm rounded-xl shadow-[0_10px_25px_rgba(255,164,0,0.28)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Verifying access...' : 'Unlock Studio & Enter Suite'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Divider: Or access with */}
          <div className="relative flex items-center justify-center pt-0.5">
            <div className="border-t border-[#ACBEA3]/20 w-full" />
            <span className="bg-[#08221B] px-3 text-[10.5px] font-poppins text-[#ACBEA3]/60 whitespace-nowrap">
              Or access with
            </span>
            <div className="border-t border-[#ACBEA3]/20 w-full" />
          </div>

          {/* Social / Fast SSO Pill Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleFastUnlock}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#ACBEA3]/25 bg-[#2C3330]/80 hover:bg-[#2C3330] text-xs font-poppins font-medium text-[#F8F4ED] transition-all cursor-pointer hover:border-[#FFA400]/50 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google SSO</span>
            </button>

            <button
              type="button"
              onClick={handleFastUnlock}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#ACBEA3]/25 bg-[#2C3330]/80 hover:bg-[#2C3330] text-xs font-poppins font-medium text-[#F8F4ED] transition-all cursor-pointer hover:border-[#FFA400]/50 active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-[#F8F4ED]" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.19-9.52-11.13-20.21-14.82-32.06-3.69-11.85-5.54-22.99-5.54-33.42 0-14.34 3.58-26.24 10.75-35.7 7.17-9.45 16.3-14.28 27.4-14.49 4.8 0 10.15 1.25 16.07 3.76 5.92 2.51 9.87 3.82 11.85 3.92 1.63 0 5.62-1.36 11.96-4.07 6.34-2.71 11.86-3.87 16.57-3.48 12.39.87 22.39 5.39 30.01 13.56-10.87 6.53-16.19 15.55-15.98 27.06.22 9.02 3.69 16.74 10.43 23.15 6.74 6.41 14.89 10.1 24.45 11.08-2.17 6.53-4.89 13.37-8.15 20.52zM119.22 31.84c0-7.28 2.61-14.13 7.82-20.54 5.22-6.41 11.63-10.43 19.24-12.06.22 1.3.33 2.5.33 3.59 0 7.06-2.72 13.91-8.15 20.54-5.43 6.63-12.06 10.43-19.89 11.41.21-.98.32-2.17.32-3.57z" />
              </svg>
              <span>Apple ID</span>
            </button>
          </div>

          {/* Security badge at bottom */}
          <div className="flex items-center justify-between pt-2 border-t border-[#ACBEA3]/20 text-[11px] text-[#ACBEA3]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFA400]" />
              <span>256-bit Encrypted Session</span>
            </div>
            <span className="font-space-mono text-[#F8F4ED]/70">PAN: KJKPD8069P</span>
          </div>
        </div>

      </div>
    </div>
  );
}
