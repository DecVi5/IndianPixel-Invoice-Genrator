import { BRAND_LOGO_DATA_URL } from '../assets/brandLogoData.ts';

export const DEFAULT_BRAND_LOGO = BRAND_LOGO_DATA_URL;

interface BrandLogoProps {
  customLogoUrl?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'horizontal';
  theme?: 'black' | 'green' | 'white' | 'auto';
  isPrint?: boolean;
  withText?: boolean;
}

export function BrandLogo({
  customLogoUrl,
  className = '',
  size = 'md',
  variant = 'horizontal',
  theme = 'white',
  isPrint = false,
  withText,
}: BrandLogoProps) {
  // Determine text color: by default light/linen (#F8F4ED) for dark backgrounds
  let mainColor = '#F8F4ED';

  if (theme === 'black') {
    mainColor = '#000000';
  } else if (theme === 'green') {
    mainColor = '#08221B';
  } else if (theme === 'white') {
    mainColor = '#F8F4ED';
  } else {
    mainColor = isPrint ? '#08221B' : '#F8F4ED';
  }

  // Dimension scaling
  const iconDims: Record<string, number> = {
    xs: 22,
    sm: 30,
    md: 40,
    lg: 50,
    xl: 64,
  };
  const isCustomValid =
    customLogoUrl &&
    customLogoUrl.trim().length > 0 &&
    !customLogoUrl.includes('placeholder') &&
    customLogoUrl !== '/logo.svg' &&
    customLogoUrl !== '/vite.svg';

  const activeLogoUrl = isCustomValid ? customLogoUrl : DEFAULT_BRAND_LOGO;
  const dim = iconDims[size] || 36;

  const renderIcon = () => (
    <div
      className="inline-flex items-center justify-center shrink-0 select-none overflow-hidden"
      style={{ width: dim, height: dim }}
    >
      <img
        src={activeLogoUrl}
        alt="Indian Pixel Brand Logo"
        className="w-full h-full object-contain pointer-events-none transition-transform duration-200"
        loading="eager"
        onError={(e) => {
          if (e.currentTarget.src !== BRAND_LOGO_DATA_URL) {
            e.currentTarget.src = BRAND_LOGO_DATA_URL;
          }
        }}
      />
    </div>
  );

  const shouldShowText = withText ?? (variant === 'horizontal');

  if (!shouldShowText) {
    return <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>{renderIcon()}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 whitespace-nowrap leading-none select-none ${className}`}>
      {renderIcon()}
      <span
        className="font-montserrat font-bold tracking-tight leading-none whitespace-nowrap"
        style={{
          color: mainColor,
          fontSize:
            size === 'xs'
              ? '13px'
              : size === 'sm'
              ? '15px'
              : size === 'lg'
              ? '22px'
              : size === 'xl'
              ? '28px'
              : '18px',
          letterSpacing: '-0.02em',
        }}
      >
        Indian Pixel
      </span>
    </div>
  );
}

