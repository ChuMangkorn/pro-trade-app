'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import { useOrders, Order } from '@/context/OrderContext';

// --- Helper Components for Tables test ---
const InfoTable: React.FC<{ headers: string[]; children: React.ReactNode }> = ({ headers, children }) => (
  <div className="p-2 text-xs overflow-x-auto custom-scrollbar">
    <table className="w-full min-w-[600px]">
      <thead><tr className="text-left text-muted-foreground">{headers.map(h => <th key={h} className="py-2 px-1 font-normal">{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
const TableRow: React.FC<{ cells: (string | React.ReactNode)[] }> = ({ cells }) => (
  <tr className="hover:bg-white/5">{cells.map((cell, index) => <td key={index} className="py-2 px-1 border-t border-border">{cell}</td>)}</tr>
);

// --- Panel Components using data from context ---
const OpenOrdersPanel = () => {
  const { openOrders, cancelOrder } = useOrders();
  const headers = ['Date', 'Pair', 'Type', 'Side', 'Price', 'Amount', 'Total', 'Action'];
  return (
    <InfoTable headers={headers}>
      {openOrders.length > 0 ? openOrders.map(order => (
        <TableRow key={order.id} cells={[
          order.time,
          order.symbol.replace('USDT', '/USDT'),
          order.type,
          <span key="side" className={order.side === 'Buy' ? 'text-green-500' : 'text-red-500'}>{order.side}</span>,
          order.price.toFixed(2),
          order.amount.toFixed(4),
          order.total.toFixed(2),
          <button
            key="action"
            onClick={() => cancelOrder(order.id)}
            className="text-foreground hover:text-[var(--color-binance-yellow)]"
          >
            Cancel
          </button>
        ]} />
      )) : (
        <tr><td colSpan={headers.length} className="text-center text-muted-foreground py-4">No open orders</td></tr>
      )}
    </InfoTable>
  );
};

const TradeHistoryPanel = () => {
    const { tradeHistory } = useOrders();
    const headers = ['Date', 'Pair', 'Type', 'Side', 'Price', 'Amount', 'Total'];
    return (
        <InfoTable headers={headers}>
            {tradeHistory.length > 0 ? tradeHistory.map(trade => (
                <TableRow key={trade.id} cells={[
                    trade.time,
                    trade.symbol.replace('USDT', '/USDT'),
                    trade.type,
                    <span key="side" className={trade.side === 'Buy' ? 'text-green-500' : 'text-red-500'}>{trade.side}</span>,
                    trade.price.toFixed(2),
                    trade.amount.toFixed(4),
                    trade.total.toFixed(2)
                ]} />
            )) : (
              <tr><td colSpan={headers.length} className="text-center text-muted-foreground py-4">No trade history</td></tr>
            )}
        </InfoTable>
    );
};


// --- Trading Panel (Order Form) ---
type OrderType = 'Limit' | 'Market' | 'Stop-limit';

const FormInput: React.FC<{ id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; unit: string; disabled?: boolean; }> = 
({ id, label, value, onChange, placeholder, unit, disabled = false }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
        <div className="relative">
            <input
                type="number" id={id} value={value} onChange={onChange} disabled={disabled}
                className="w-full bg-background border-border rounded-md shadow-sm p-2 pr-12 text-sm focus:outline-none focus:ring-1 ring-[var(--color-binance-yellow)] disabled:opacity-50"
                placeholder={placeholder || '0.00'}
                step="any"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-muted-foreground">{unit}</span>
        </div>
    </div>
);

const TradeExecutionForm: React.FC<{ side: 'Buy' | 'Sell', orderType: OrderType, symbol: string }> = ({ side, orderType, symbol }) => {
  const { data } = useSharedBinanceWebSocket();
  const { placeOrder } = useOrders();
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [sliderValue, setSliderValue] = useState(0); // State for slider position

  const baseCurrency = symbol.replace('USDT', '');
  const quoteCurrency = 'USDT';
  const availableQuote = 10000.00;
  const availableBase = 0.5;
  const availableBalance = side === 'Buy' ? availableQuote : availableBase;
  const balanceUnit = side === 'Buy' ? quoteCurrency : baseCurrency;

  useEffect(() => {
    if (data?.price) {
      const currentPrice = parseFloat(data.price).toFixed(2);
      if (orderType !== 'Limit' && orderType !== 'Stop-limit') { setPrice(''); } 
      else if (price === '') { setPrice(currentPrice); }
    }
  }, [data?.price, orderType, price]);

  // Update amount when slider changes
  useEffect(() => {
    const percentage = sliderValue / 100;
    if (side === 'Buy') {
      const currentPrice = parseFloat(price || data?.price || '0');
      if (currentPrice > 0) {
        const totalValue = availableBalance * percentage;
        const newAmount = totalValue / currentPrice;
        setAmount(newAmount.toFixed(4));
      }
    } else { // Sell
      const newAmount = availableBalance * percentage;
      setAmount(newAmount.toFixed(4));
    }
  }, [sliderValue, side, availableBalance, price, data?.price]);


  const total = useMemo(() => {
    if (orderType === 'Market' && side === 'Buy') return parseFloat(amount) || 0;
    return (parseFloat(price) * parseFloat(amount)) || 0;
  }, [price, amount, orderType, side]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || (orderType !== 'Market' && !price)) return;
    placeOrder({ symbol, type: orderType, side, price: orderType === 'Market' ? parseFloat(data?.price || '0') : parseFloat(price), amount: parseFloat(amount), total: total });
    setAmount('');
    setSliderValue(0); // Reset slider
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Avbl</span>
        <span>{availableBalance.toFixed(4)} {balanceUnit}</span>
      </div>
      
      {orderType === 'Limit' || orderType === 'Stop-limit' ? (
        <FormInput id={`${side}-price`} label="Price" value={price} onChange={e => setPrice(e.target.value)} unit={quoteCurrency} />
      ) : (
        <FormInput id={`${side}-price`} label="Price" value="Market" onChange={()=>{}} unit={quoteCurrency} disabled={true}/>
      )}

      {orderType === 'Stop-limit' && ( <FormInput id={`${side}-stop-price`} label="Stop" value={stopPrice} onChange={e => setStopPrice(e.target.value)} unit={quoteCurrency} /> )}

      <FormInput id={`${side}-amount`} label="Amount" value={amount} onChange={e => setAmount(e.target.value)} unit={baseCurrency} />
      
      <div className="pt-1">
        <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-600 slider-thumb"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
        </div>
      </div>
      
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Total</span>
        <span>{total.toFixed(2)} {quoteCurrency}</span>
      </div>

      <button type="submit" disabled={!amount} className={`w-full py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 ${ side === 'Buy' ? 'bg-green-500 hover:bg-green-500/90' : 'bg-red-500 hover:bg-red-500/90' }`}>
        {side === 'Buy' ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
      </button>
    </form>
  );
};

const OrderForm: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [orderType, setOrderType] = useState<OrderType>('Limit');
  return (
    <div className="p-2 h-full">
      <div className="flex items-center space-x-4 mb-3">
        <button type="button" onClick={() => setOrderType('Limit')} className={`text-sm ${orderType === 'Limit' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Limit</button>
        <button type="button" onClick={() => setOrderType('Market')} className={`text-sm ${orderType === 'Market' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Market</button>
        <button type="button" onClick={() => setOrderType('Stop-limit')} className={`text-sm ${orderType === 'Stop-limit' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Stop-limit</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-xs">
        <TradeExecutionForm side="Buy" orderType={orderType} symbol={symbol} />
        <TradeExecutionForm side="Sell" orderType={orderType} symbol={symbol} />
      </div>
    </div>
  );
};


// --- Main Activity Panel (Structure is the same) ---
const ActivityPanel: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [activeTab, setActiveTab] = useState<'Open Orders' | 'Trade History'>('Open Orders');

  const renderContent = () => {
    switch (activeTab) {
      case 'Open Orders': return <OpenOrdersPanel />;
      case 'Trade History': return <TradeHistoryPanel />;
      default: return null;
    }
  };

  const tabs: ('Open Orders' | 'Trade History')[] = ['Open Orders', 'Trade History'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-border"><OrderForm symbol={symbol} /></div>
      <div className="flex-grow flex flex-col min-h-0">
        <div className="flex-shrink-0 flex items-center border-b border-border px-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors outline-none ${
                activeTab === tab
                  ? 'border-b-2 border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]'
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
    </div>
  );
};

export default ActivityPanel;