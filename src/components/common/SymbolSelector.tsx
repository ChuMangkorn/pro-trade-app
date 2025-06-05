import React from 'react';

interface SymbolSelectorProps {
  currentSymbol: string;
  onChange: (symbol: string) => void;
}

const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'MATICUSDT'];

const SymbolSelector: React.FC<SymbolSelectorProps> = ({ currentSymbol, onChange }) => (
  <div className="relative flex items-center group">
    <div className="font-semibold text-lg text-foreground">
      {currentSymbol.replace('USDT', '/USDT')}
    </div>

    {/* Simple dropdown arrow */}
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>

    {/* The actual select element is transparent and covers the component */}
    <select
      id="symbol"
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      value={currentSymbol}
      onChange={e => onChange(e.target.value)}
    >
      {symbols.map(symbol => (
        <option key={symbol} value={symbol}>
          {symbol}
        </option>
      ))}
    </select>
  </div>
);

export default SymbolSelector;