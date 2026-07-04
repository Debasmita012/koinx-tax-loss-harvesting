import { useState } from 'react';
import type { Holding } from '../types';
import { formatHolding, formatPrice, formatCompact, formatFull, formatGain } from '../utils/formatters';
import '../styles/HoldingsTable.css';

interface Props {
  holdings: Holding[];
  selectedIndices: number[];
  toggleHolding: (index: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  optimizeSelection: () => void;
}

const ValueWithTooltip = ({
  value,
  prefix = '$',
  compact = true,
  className = '',
  isGain = false,
  unit = ''
}: {
  value: number,
  prefix?: string,
  compact?: boolean,
  className?: string,
  isGain?: boolean,
  unit?: string
}) => {
  let displayValue = '';
  if (isGain) {
    displayValue = formatGain(value);
  } else if (compact) {
    displayValue = formatCompact(value);
  } else {
    displayValue = formatPrice(value, unit);
  }

  const fullValue = formatFull(value, prefix) + (unit ? `/${unit}` : '');

  return (
    <div className={`value-tooltip-container ${className}`}>
      {displayValue}
      <div className="value-tooltip">
        {fullValue}
        <div className="value-tooltip__beak"></div>
      </div>
    </div>
  );
};

export default function HoldingsTable({
  holdings = [],
  selectedIndices = [],
  toggleHolding,
  selectAll,
  deselectAll,
  optimizeSelection
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'stcg' | 'ltcg' | 'gain', direction: 'asc' | 'desc' }>({
    key: 'gain',
    direction: 'desc'
  });

  const INITIAL_COUNT = 6;
  const allSelected = holdings.length > 0 && selectedIndices.length === holdings.length;

  const handleSort = (key: 'stcg' | 'ltcg') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Tax impact of harvesting a holding (negative = saves money, positive = costs money)
  const getImpact = (h: Holding) => h.stcg.gain + h.ltcg.gain;

  // Count of loss-making holdings for the optimize button badge
  const lossHoldingsCount = holdings.filter(h => getImpact(h) < 0).length;

  // Filter by search query, then sort
  const filtered = [...holdings]
    .map((h, i) => ({ ...h, id: i }))
    .filter(h => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        h.coinName.toLowerCase().includes(q) ||
        h.coin.toLowerCase().includes(q)
      );
    });

  const sorted = filtered.sort((a, b) => {
    const { key, direction } = sortConfig;
    let valA = 0;
    let valB = 0;

    if (key === 'stcg' || key === 'ltcg') {
      valA = a[key]?.gain || 0;
      valB = b[key]?.gain || 0;
    } else {
      valA = (a.stcg?.gain || 0) + (a.ltcg?.gain || 0);
      valB = (b.stcg?.gain || 0) + (b.ltcg?.gain || 0);
    }

    return direction === 'desc' ? valB - valA : valA - valB;
  });

  const visible = showAll ? sorted : sorted.slice(0, INITIAL_COUNT);

  return (
    <section className="ht">
      {/* Title row with search & controls */}
      <div className="ht__title-row">
        <h2 className="ht__title">Holdings</h2>

        <div className="ht__controls">
          {/* Search input */}
          <div className="ht__search-wrapper">
            <svg className="ht__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="ht__search-input"
              placeholder="Search asset..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              id="holdings-search"
            />
            {searchQuery && (
              <button
                className="ht__search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>

          {/* Optimize for savings button */}
          {lossHoldingsCount > 0 && (
            <button
              className="ht__optimize-btn"
              onClick={optimizeSelection}
              title={`Auto-select all ${lossHoldingsCount} loss-making holdings to maximize tax savings`}
              id="optimize-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Optimize for Savings
              <span className="ht__optimize-badge">{lossHoldingsCount}</span>
            </button>
          )}
        </div>
      </div>

      <div className="ht__wrapper">
        <table className="ht__table">
          <thead>
            <tr className="ht__header">
              <th className="ht__th ht__th--checkbox">
                <div className="ht__checkbox-wrapper" onClick={(e) => { e.stopPropagation(); allSelected ? deselectAll() : selectAll(); }}>
                  <input
                    type="checkbox"
                    readOnly
                    checked={allSelected}
                    className="ht__checkbox"
                  />
                  <div className={`ht__checkmark ${allSelected ? 'is-checked' : ''}`}>
                    {allSelected && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                  </div>
                </div>
              </th>
              <th className="ht__th ht__th--asset">Asset</th>
              <th className="ht__th">
                Holdings
                <div className="ht__th-sub">Current Market Rate</div>
              </th>
              <th className="ht__th">Total Current Value</th>
              <th className="ht__th ht__th--sortable" onClick={() => handleSort('stcg')}>
                <div className="ht__th-content">
                  {sortConfig.key === 'stcg' && (
                    <svg className={`ht__sort-arrow ${sortConfig.direction}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  )}
                  Short-term
                </div>
              </th>
              <th className="ht__th ht__th--sortable" onClick={() => handleSort('ltcg')}>
                <div className="ht__th-content">
                  {sortConfig.key === 'ltcg' && (
                    <svg className={`ht__sort-arrow ${sortConfig.direction}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  )}
                  Long-Term
                </div>
              </th>
              <th className="ht__th">Amount to Sell</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="ht__empty">
                  <div className="ht__empty-content">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" style={{ opacity: 0.3 }}>
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                    <span>No assets match "<strong>{searchQuery}</strong>"</span>
                  </div>
                </td>
              </tr>
            )}

            {visible.map((h) => {
              const selected = selectedIndices.includes(h.id);
              const price = h.currentPrice || 0;
              const totalHolding = h.totalHolding || 0;
              const impact = getImpact(h);

              return (
                <tr
                  key={`${h.coin}-${h.id}`}
                  className={`ht__row ${selected ? 'ht__row--selected' : ''}`}
                  onClick={() => toggleHolding(h.id)}
                >
                  <td className="ht__cell ht__cell--checkbox" onClick={e => e.stopPropagation()}>
                    <div className="ht__checkbox-wrapper" onClick={() => toggleHolding(h.id)}>
                      <input type="checkbox" readOnly checked={selected} className="ht__checkbox" />
                      <div className={`ht__checkmark ${selected ? 'is-checked' : ''}`}>
                        {selected && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                      </div>
                    </div>
                  </td>

                  <td className="ht__cell">
                    <div className="ht__asset">
                      <img src={h.logo} className="ht__asset-logo" alt="" />
                      <div className="ht__asset-info">
                        <span className="ht__asset-name">{h.coinName}</span>
                        <span className="ht__asset-symbol">{h.coin}</span>
                      </div>
                    </div>
                  </td>

                  <td className="ht__cell">
                    <div className="ht__cell-stack">
                      <span className="ht__holdings-amount">{formatHolding(totalHolding)} {h.coin}</span>
                      <ValueWithTooltip value={price} unit={h.coin} compact={false} className="ht__holdings-rate-tooltip" />
                    </div>
                  </td>

                  <td className="ht__cell">
                    <div className="ht__cell-stack">
                      <ValueWithTooltip value={totalHolding * price} className="ht__total-value" />
                    </div>
                  </td>

                  <td className="ht__cell">
                    <div className="ht__cell-stack">
                      <ValueWithTooltip
                        value={h.stcg?.gain || 0}
                        isGain={true}
                        className={(h.stcg?.gain || 0) < 0 ? 'ht__gain--loss' : 'ht__gain--profit'}
                      />
                      <span className="ht__holdings-rate">
                        {price > 0 ? formatHolding(Math.abs((h.stcg?.gain || 0) / price)) : '0.00'} {h.coin}
                      </span>
                    </div>
                  </td>

                  <td className="ht__cell">
                    <div className="ht__cell-stack">
                      <ValueWithTooltip
                        value={h.ltcg?.gain || 0}
                        isGain={true}
                        className={(h.ltcg?.gain || 0) < 0 ? 'ht__gain--loss' : 'ht__gain--profit'}
                      />
                      <span className="ht__holdings-rate">
                        {price > 0 ? formatHolding(Math.abs((h.ltcg?.gain || 0) / price)) : '0.00'} {h.coin}
                      </span>
                    </div>
                  </td>

                  <td className="ht__cell">
                    <div className="ht__cell-stack">
                      <span className="ht__sell-amount">
                        {selected ? `${formatHolding(totalHolding)} ${h.coin}` : '–'}
                      </span>
                      {/* Tax Impact Badge — always visible, shows harvesting impact */}
                      {impact !== 0 && (
                        <span className={`ht__impact ${impact < 0 ? 'ht__impact--save' : 'ht__impact--cost'} ${selected ? 'ht__impact--active' : ''}`}>
                          {impact < 0
                            ? `↓ Saves ${formatCompact(Math.abs(impact))}`
                            : `↑ Costs ${formatCompact(impact)}`
                          }
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Show more / show less — only when not searching */}
        {!searchQuery && holdings.length > INITIAL_COUNT && (
          <button className="ht__view-toggle" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : `View all (${holdings.length})`}
          </button>
        )}

        {/* Search results count */}
        {searchQuery && (
          <p className="ht__search-results">
            {sorted.length === 0
              ? 'No results found'
              : `Showing ${sorted.length} of ${holdings.length} assets`}
          </p>
        )}
      </div>
    </section>
  );
}
