'use client';
import React from 'react';
import TickerList from '@/components/trading/TickerList';

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSymbol: string;
}

const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({ isOpen, onClose, activeSymbol }) => {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-binance-panel-bg)] rounded-lg shadow-xl w-full max-w-lg h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-lg text-foreground">Markets</h2>
          <button onClick={onClose} className="text-2xl text-muted-foreground hover:text-foreground transition-colors">&times;</button>
        </div>

        <div className="flex-1 min-h-0 p-2">
          <TickerList activeSymbol={activeSymbol} />
        </div>
      </div>
    </div>
  );
};

export default SymbolSearchModal;