import React from 'react';

interface SymbolSelectorProps {
  currentSymbol: string;
  onChange: (symbol: string) => void;
}

const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT'];

const SymbolSelector: React.FC<SymbolSelectorProps> = ({ currentSymbol, onChange }) => (
  <div className="flex items-center space-x-2">
    <label htmlFor="symbol" className="text-sm font-medium">Symbol:</label>
    <select
      id="symbol"
      className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
      value={currentSymbol}
      onChange={e => onChange(e.target.value)}
    >
      {symbols.map(symbol => (
        <option key={symbol} value={symbol}>{symbol}</option>
      ))}
    </select>
  </div>
);

export default SymbolSelector;
