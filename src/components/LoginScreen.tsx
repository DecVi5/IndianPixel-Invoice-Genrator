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
  User,
  Mail as MailIcon,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  logoDataUrl?: string;
}

const AUTHORIZED_ACCOUNTS = [
  {
    email: 'admin@indianpixel.in',
    role: 'Studio Administrator / Director',
    defaultUsername: 'Admin',
  },
  {
    email: 'cfo@indianpixel.in',
    role: 'Chief Financial Officer / Finance Lead',
    defaultUsername: 'CFO',
  },
];

const MASTER_PASSWORD = 'IPCT*4057#';

export function LoginScreen({ onLoginSuccess, logoDataUrl }: LoginScreenProps) {
  const [username, setUsername] = useState('Admin');
  const [mail, setMail] = useState('admin@indianpixel.in');
  const [password, setPassword] = useState('');
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

  const handleAuthenticate = (emailToTest = mail, pwdToTest = password) => {
    setIsSubmitting(true);
    setError(null);

    const cleanEmail = emailToTest.trim().toLowerCase();
    const cleanPwd = pwdToTest.trim();

    const isAuthorizedEmail = AUTHORIZED_ACCOUNTS.some(
      (acc) => acc.email.toLowerCase() === cleanEmail
    );

    if (!cleanEmail) {
      setIsSubmitting(false);
      setError('Please enter your authorized Mail ID.');
      return;
    }

    if (!isAuthorizedEmail) {
      setIsSubmitting(false);
      setError('Unauthorized Mail ID. Access restricted to admin@indianpixel.in or cfo@indianpixel.in.');
      return;
    }

    if (cleanPwd !== MASTER_PASSWORD) {
      setTimeout(() => {
        setIsSubmitting(false);
        setError('Incorrect PassWord. Please enter the authorized studio password.');
      }, 250);
      return;
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess();
    }, 350);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleAuthenticate(mail, password);
  };

  const handleSelectAccount = (accountEmail: string, defaultName: string) => {
    setMail(accountEmail);
    setUsername(defaultName);
    setPassword(MASTER_PASSWORD);
    setError(null);
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

        {/* RIGHT COLUMN: Clean Authentication Form Panel */}
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
            <p className="text-xs text-[#ACBEA3] font-poppins">
              Authorized personnel only. Please verify your studio credentials.
            </p>
          </div>

          {/* Quick Account Selector Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#ACBEA3] block">
              Authorized Accounts
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AUTHORIZED_ACCOUNTS.map((acc) => {
                const isSelected = mail.toLowerCase() === acc.email.toLowerCase();
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectAccount(acc.email, acc.defaultUsername)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#2C3330] border-[#FFA400] ring-1 ring-[#FFA400]/40'
                        : 'bg-[#2C3330]/50 border-[#ACBEA3]/25 hover:bg-[#2C3330] hover:border-[#ACBEA3]/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#F8F4ED] font-space-mono">
                        {acc.email}
                      </div>
                      <div className="text-[10px] text-[#ACBEA3]">
                        {acc.role}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#FFA400] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form with exact requested fields: Username, "Mail", "PassWord" */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#ACBEA3] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FFA400]" />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Username"
                required
                className="w-full px-3.5 py-2.5 bg-[#2C3330] hover:bg-[#2C3330]/90 focus:bg-[#2C3330] border border-[#ACBEA3]/30 focus:border-[#FFA400] focus:ring-1 focus:ring-[#FFA400]/40 rounded-xl text-xs sm:text-sm text-[#F8F4ED] placeholder-[#ACBEA3]/50 outline-none transition-all"
              />
            </div>

            {/* Field 2: Mail */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#ACBEA3] flex items-center gap-1.5">
                <MailIcon className="w-3.5 h-3.5 text-[#FFA400]" />
                <span>Mail</span>
              </label>
              <input
                type="email"
                value={mail}
                onChange={(e) => {
                  setMail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="admin@indianpixel.in or cfo@indianpixel.in"
                required
                className="w-full px-3.5 py-2.5 bg-[#2C3330] hover:bg-[#2C3330]/90 focus:bg-[#2C3330] border border-[#ACBEA3]/30 focus:border-[#FFA400] focus:ring-1 focus:ring-[#FFA400]/40 rounded-xl text-xs sm:text-sm text-[#F8F4ED] placeholder-[#ACBEA3]/50 font-space-mono outline-none transition-all"
              />
            </div>

            {/* Field 3: PassWord */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#ACBEA3] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#FFA400]" />
                  <span>PassWord</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPassword(MASTER_PASSWORD)}
                  className="text-[10px] text-[#FFA400] hover:underline cursor-pointer font-space-mono"
                >
                  Fill Key
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter PassWord"
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

