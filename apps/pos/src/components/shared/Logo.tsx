/**
 * uniPOS Logo
 * Professional POS logo mark + Wordmark combination
 * Styled with accent color (gold/blue) and serif typography
 */

import logoMark from '../../assets/uni_pos.png';

export function Logo({
  size = 'md',
  showText = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}) {
  const sizeMap = {
    sm: { mark: 20, text: 12, gap: 1.5 },
    md: { mark: 34, text: 18, gap: 2.5 },
    lg: { mark: 48, text: 24, gap: 3 },
  };

  const config = sizeMap[size];

  return (
    <div className="flex items-center gap-px" style={{ gap: `${config.gap * 0.25}rem` }}>
      {/* Logo Mark — Professional POS icon */}
      <img
        src={logoMark}
        alt="uniPOS"
        className="flex-shrink-0"
        style={{
          width: `${config.mark}px`,
          height: `${config.mark}px`,
        }}
      />

      {/* Wordmark + Tagline */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          <div
            className="font-bold leading-none"
            style={{
              fontSize: `${config.text}px`,
              color: 'var(--text1)',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '0.01em',
              fontWeight: 700,
            }}
          >
            uniPOS
          </div>
          <div
            className="uppercase font-medium tracking-wide"
            style={{
              fontSize: `${config.text * 0.52}px`,
              color: 'var(--accent)',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Billing System
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Logo Mark Only (for compact use, favicons, etc.)
 */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <Logo size={size > 30 ? 'md' : 'sm'} showText={false} />
  );
}
