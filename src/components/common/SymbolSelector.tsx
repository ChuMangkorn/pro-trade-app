import React from 'react';

interface SymbolSelectorProps {
  currentSymbol: string;
  onClick: () => void;
}

const SymbolSelector: React.FC<SymbolSelectorProps> = ({ currentSymbol, onClick }) => (
  <button onClick={onClick} className="relative flex items-center group cursor-pointer p-2 rounded-md hover:bg-white/5">
    <div className="font-semibold text-lg text-foreground">
      {currentSymbol.replace('USDT', '/USDT')}
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
);

export default SymbolSelector;