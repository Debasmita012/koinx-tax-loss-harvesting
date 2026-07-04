import type { CapitalGains } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import '../styles/CapitalGainsCard.css';

interface CapitalGainsCardProps {
  title: string;
  variant: 'pre' | 'post';
  data: CapitalGains;
  savings?: number;
}

export default function CapitalGainsCard({ title, variant, data, savings = 0 }: CapitalGainsCardProps) {
  // Only animate the "After Harvesting" (post) card — it changes dynamically
  const animDuration = variant === 'post' ? 450 : 0;

  const stcgProfits = useAnimatedNumber(data.stcg.profits, animDuration);
  const stcgLosses  = useAnimatedNumber(data.stcg.losses,  animDuration);
  const ltcgProfits = useAnimatedNumber(data.ltcg.profits, animDuration);
  const ltcgLosses  = useAnimatedNumber(data.ltcg.losses,  animDuration);
  const animSavings = useAnimatedNumber(savings,            animDuration);

  const stcgNet      = stcgProfits - stcgLosses;
  const ltcgNet      = ltcgProfits - ltcgLosses;
  const realisedGains = stcgNet + ltcgNet;

  return (
    <div className={`cg-card cg-card--${variant}`} id={`cg-card-${variant}`}>
      <h2 className="cg-card__title">{title}</h2>

      <div className="cg-card__table">
        {/* Header row */}
        <div className="cg-card__row cg-card__row--header">
          <span className="cg-card__col-label"></span>
          <span className="cg-card__col-value">Short-term</span>
          <span className="cg-card__col-value">Long-term</span>
        </div>

        {/* Profits row */}
        <div className="cg-card__row">
          <span className="cg-card__row-label">Profits</span>
          <span className="cg-card__row-value">{formatCurrency(stcgProfits)}</span>
          <span className="cg-card__row-value">{formatCurrency(ltcgProfits)}</span>
        </div>

        {/* Losses row */}
        <div className="cg-card__row">
          <span className="cg-card__row-label">Losses</span>
          <span className="cg-card__row-value">-{formatCurrency(stcgLosses)}</span>
          <span className="cg-card__row-value">-{formatCurrency(ltcgLosses)}</span>
        </div>

        <div className="cg-card__divider"></div>

        {/* Net Capital Gains row */}
        <div className="cg-card__row cg-card__row--net">
          <span className="cg-card__row-label">Net Capital Gains</span>
          <span className="cg-card__row-value">{formatCurrency(stcgNet)}</span>
          <span className="cg-card__row-value">{formatCurrency(ltcgNet)}</span>
        </div>
      </div>

      <div className="cg-card__footer">
        <div className="cg-card__total-row">
          <span className="cg-card__total-label">
            {variant === 'post' ? 'Effective Capital Gains:' : 'Realised Capital Gains:'}
          </span>
          <span className={`cg-card__total-value ${variant === 'post' ? 'cg-card__total-value--animated' : ''}`}>
            {formatCurrency(realisedGains)}
          </span>
        </div>

        {animSavings > 0 && variant === 'post' && (
          <div className="cg-card__savings">
            <span className="cg-card__savings-emoji">🎉</span>
            <span className="cg-card__savings-text">
              You are going to save upto <strong>{formatCurrency(animSavings)}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
