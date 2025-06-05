'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';

// --- Helper Components for Tables ---
const InfoTable: React.FC<{ headers: string[]; children: React.ReactNode }> = ({ headers, children }) => (
  <div className="p-2 text-xs overflow-x-auto custom-scrollbar">
    <table className="w-full min-w-[600px]">
      <thead>
        <tr className="text-left text-muted-foreground">
          {headers.map(h => <th key={h} className="py-2 px-1 font-normal">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  </div>
);

const TableRow: React.FC<{ cells: (string | React.ReactNode)[] }> = ({ cells }) => (
  <tr className="hover:bg-white/5">
    {cells.map((cell, index) => (
      <td key={index} className="py-2 px-1 border-t border-border">{cell}</td>
    ))}
  </tr>
);

// --- Mock Data and Components for Tabs ---
const mockOpenOrders = [
  { id: 1, time: '2023-10-27 10:30', pair: 'BTC/USDT', type: 'Limit', side: 'Buy', price: 60000.00, amount: 0.001, filled: "0%", total: 60.00 },
  { id: 2, time: '2023-10-27 10:32', pair: 'ETH/USDT', type: 'Limit', side: 'Sell', price: 3000.00, amount: 0.05, filled: "0%", total: 150.00 },
];

const OpenOrdersPanel = () => {
  const headers = ['Date', 'Pair', 'Type', 'Side', 'Price', 'Amount', 'Filled', 'Total', 'Action'];
  return (
    <InfoTable headers={headers}>
      {mockOpenOrders.map(order => (
        <TableRow key={order.id} cells={[
          order.time, order.pair, order.type,
          <span key="side" className={order.side === 'Buy' ? 'text-green-500' : 'text-red-500'}>{order.side}</span>,
          order.price.toFixed(2), order.amount, order.filled, order.total.toFixed(2),
          <button key="action" className="text-foreground hover:text-yellow-500">Cancel</button>
        ]} />
      ))}
    </InfoTable>
  );
};

const mockTradeHistory = [
    { id: 3, time: '2023-10-27 09:15', pair: 'BTC/USDT', type: 'Market', side: 'Buy', price: 59850.50, amount: 0.002, total: 119.70 },
    { id: 4, time: '2023-10-26 18:45', pair: 'SOL/USDT', type: 'Limit', side: 'Sell', price: 140.20, amount: 2, total: 280.40 },
];

const TradeHistoryPanel = () => {
    const headers = ['Date', 'Pair', 'Type', 'Side', 'Price', 'Amount', 'Total'];
    return (
        <InfoTable headers={headers}>
            {mockTradeHistory.map(trade => (
                <TableRow key={trade.id} cells={[
                    trade.time, trade.pair, trade.type,
                    <span key="side" className={trade.side === 'Buy' ? 'text-green-500' : 'text-red-500'}>{trade.side}</span>,
                    trade.price.toFixed(2), trade.amount, trade.total.toFixed(2)
                ]} />
            ))}
        </InfoTable>
    );
};


// --- Trading Panel ---
const FormInput: React.FC<{id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; unit: string;}> = 
({ id, label, value, onChange, placeholder, unit }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
        <div className="relative">
            <input
                type="number" id={id} value={value} onChange={onChange}
                className="w-full bg-background border-border rounded-md shadow-sm p-2 pr-12 text-sm focus:outline-none focus:ring-1 ring-yellow-500"
                placeholder={placeholder || '0.00'}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-muted-foreground">{unit}</span>
        </div>
    </div>
);

interface PercentButtonProps { children: React.ReactNode; onClick: () => void; }
const PercentButton: React.FC<PercentButtonProps> = ({ children, onClick }) => (
    <button type="button" onClick={onClick} className="flex-1 py-1 text-xs bg-[var(--color-binance-border)]/50 hover:bg-[var(--color-binance-border)] rounded-sm transition-colors">
        {children}
    </button>
);

const TradePanel: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { data } = useSharedBinanceWebSocket();
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellAmount, setSellAmount] = useState('');

  const baseCurrency = symbol.replace('USDT', '');
  const quoteCurrency = 'USDT';
  const availableUSDT = 10000.00;
  const availableBase = 0.5;

  useEffect(() => {
    if (data?.price) {
      const priceStr = parseFloat(data.price).toFixed(2);
      setBuyPrice(priceStr);
      setSellPrice(priceStr);
    }
  }, [data?.price]);

  const buyTotal = useMemo(() => parseFloat(buyPrice) * parseFloat(buyAmount) || 0, [buyPrice, buyAmount]);
  const sellTotal = useMemo(() => parseFloat(sellPrice) * parseFloat(sellAmount) || 0, [sellPrice, sellAmount]);

  const handleSubmit = (side: 'buy' | 'sell') => (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Mock Order Placed: ${side}`);
  };

  return (
    <div className="p-4 h-full">
        <div className="flex items-center space-x-4 mb-3">
            <button type="button" onClick={() => setOrderType('limit')} className={`text-sm ${orderType === 'limit' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Limit</button>
            <button type="button" onClick={() => setOrderType('market')} className={`text-sm ${orderType === 'market' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Market</button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 text-xs">
            <form onSubmit={handleSubmit('buy')} className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Avbl</span><span>{availableUSDT.toFixed(2)} {quoteCurrency}</span></div>
                <FormInput id="buy-price" label="Price" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} unit={quoteCurrency} />
                <FormInput id="buy-amount" label="Amount" value={buyAmount} onChange={e => setBuyAmount(e.target.value)} unit={baseCurrency} />
                <div className="flex justify-between space-x-2">
                    <PercentButton onClick={() => alert('25%')}>25%</PercentButton>
                    <PercentButton onClick={() => alert('50%')}>50%</PercentButton>
                    <PercentButton onClick={() => alert('75%')}>75%</PercentButton>
                    <PercentButton onClick={() => alert('100%')}>100%</PercentButton>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{buyTotal.toFixed(2)} {quoteCurrency}</span></div>
                <button type="submit" disabled={!buyAmount} className="w-full py-2 px-4 rounded-md text-sm font-medium bg-green-500 hover:bg-green-500/90 text-white disabled:opacity-50">Buy {baseCurrency}</button>
            </form>
            <form onSubmit={handleSubmit('sell')} className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Avbl</span><span>{availableBase.toFixed(4)} {baseCurrency}</span></div>
                <FormInput id="sell-price" label="Price" value={sellPrice} onChange={e => setSellPrice(e.target.value)} unit={quoteCurrency} />
                <FormInput id="sell-amount" label="Amount" value={sellAmount} onChange={e => setSellAmount(e.target.value)} unit={baseCurrency} />
                <div className="flex justify-between space-x-2">
                    <PercentButton onClick={() => alert('25%')}>25%</PercentButton>
                    <PercentButton onClick={() => alert('50%')}>50%</PercentButton>
                    <PercentButton onClick={() => alert('75%')}>75%</PercentButton>
                    <PercentButton onClick={() => alert('100%')}>100%</PercentButton>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{sellTotal.toFixed(2)} {quoteCurrency}</span></div>
                <button type="submit" disabled={!sellAmount} className="w-full py-2 px-4 rounded-md text-sm font-medium bg-red-500 hover:bg-red-500/90 text-white disabled:opacity-50">Sell {baseCurrency}</button>
            </form>
        </div>
    </div>
  );
};


// --- Main Activity Panel ---
const ActivityPanel: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [activeTab, setActiveTab] = useState<'Trade' | 'Open Orders' | 'Trade History'>('Trade');

  const renderContent = () => {
    switch (activeTab) {
      case 'Trade': return <TradePanel symbol={symbol} />;
      case 'Open Orders': return <OpenOrdersPanel />;
      case 'Trade History': return <TradeHistoryPanel />;
      default: return null;
    }
  };

  const tabs: ('Trade' | 'Open Orders' | 'Trade History')[] = ['Trade', 'Open Orders', 'Trade History'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center border-b border-border px-4">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors outline-none ${
              activeTab === tab
                ? 'border-b-2 border-yellow-500 text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
};

export default ActivityPanel;