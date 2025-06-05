'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';

// This is the trading panel component, now defined inside ActivityPanel.
const TradePanel: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { data } = useSharedBinanceWebSocket();
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const baseCurrency = symbol.replace('USDT', '');
  const quoteCurrency = 'USDT';
  const currentPrice = data?.price ? parseFloat(data.price) : 0;

  // Update price for limit orders when the data is available or symbol changes
  useEffect(() => {
    if (currentPrice > 0) {
      setPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice]);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // This is where you would typically call an API to place the order
    alert(`Mock Order Placed:\nSymbol: ${symbol}\nSide: ${side.toUpperCase()}\nType: ${orderType.toUpperCase()}\nAmount: ${amount} ${baseCurrency}\nPrice: ${orderType === 'limit' ? `$${price}` : 'Market'}`);
    setAmount(''); // Reset amount after submission
  }, [symbol, side, orderType, amount, price, baseCurrency]);

  const buttonClass = side === 'buy'
    ? 'bg-green-500 hover:bg-green-600 text-white'
    : 'bg-red-500 hover:bg-red-600 text-white';

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSide('buy')}
          className={`py-2 rounded-md text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-green-500/20 text-green-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`py-2 rounded-md text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-red-500/20 text-red-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
        >
          Sell
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
            <button type="button" onClick={() => setOrderType('limit')} className={`text-sm ${orderType === 'limit' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Limit</button>
            <button type="button" onClick={() => setOrderType('market')} className={`text-sm ${orderType === 'market' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Market</button>
        </div>

        {orderType === 'limit' && (
          <div>
            <label htmlFor="price" className="block text-xs font-medium text-muted-foreground">Price ({quoteCurrency})</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 block w-full bg-muted border-border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
              placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : '0.00'}
            />
          </div>
        )}

        <div>
          <label htmlFor="amount" className="block text-xs font-medium text-muted-foreground">Amount ({baseCurrency})</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full bg-muted border-border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
            placeholder="0.00"
          />
        </div>
        
        <button
          type="submit"
          disabled={!amount}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium ${buttonClass} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {side === 'buy' ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
        </button>
      </form>
    </div>
  );
};

// Mock Data
const mockOpenOrders = [
  { id: 1, time: '2023-10-27 10:30:15', symbol: 'BTC/USDT', type: 'Limit', side: 'Buy', price: 60000.00, amount: 0.001, filled: 0, total: 60.00 },
  { id: 2, time: '2023-10-27 10:32:45', symbol: 'ETH/USDT', type: 'Limit', side: 'Sell', price: 3000.00, amount: 0.05, filled: 0, total: 150.00 },
];

const mockTradeHistory = [
  { id: 3, time: '2023-10-27 09:15:20', symbol: 'BTC/USDT', type: 'Market', side: 'Buy', price: 59850.50, amount: 0.002, total: 119.70 },
];

// Mock Panel for Open Orders
const OpenOrdersPanel = () => {
  const headers = ['Time', 'Symbol', 'Type', 'Side', 'Price', 'Amount', 'Filled', 'Total', 'Action'];
  return (
    <div className="p-2 text-sm">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400">
            {headers.map(h => <th key={h} className="py-2 px-1 font-normal">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {mockOpenOrders.map(order => (
            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-2 px-1">{order.time}</td>
              <td className="py-2 px-1">{order.symbol}</td>
              <td className="py-2 px-1">{order.type}</td>
              <td className={`py-2 px-1 ${order.side === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>{order.side}</td>
              <td className="py-2 px-1">{order.price.toFixed(2)}</td>
              <td className="py-2 px-1">{order.amount}</td>
              <td className="py-2 px-1">{order.filled}%</td>
              <td className="py-2 px-1">{order.total.toFixed(2)}</td>
              <td className="py-2 px-1"><button className="text-red-500">Cancel</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Mock Panel for Trade History
const TradeHistoryPanel = () => {
  const headers = ['Time', 'Symbol', 'Type', 'Side', 'Price', 'Amount', 'Total'];
    return (
    <div className="p-2 text-sm">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400">
            {headers.map(h => <th key={h} className="py-2 px-1 font-normal">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {mockTradeHistory.map(order => (
            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-2 px-1">{order.time}</td>
              <td className="py-2 px-1">{order.symbol}</td>
              <td className="py-2 px-1">{order.type}</td>
              <td className={`py-2 px-1 ${order.side === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>{order.side}</td>
              <td className="py-2 px-1">{order.price.toFixed(2)}</td>
              <td className="py-2 px-1">{order.amount}</td>
              <td className="py-2 px-1">{order.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ActivityPanelProps {
  symbol: string;
}

type Tab = 'Trade' | 'Open Orders' | 'Trade History';

const ActivityPanel: React.FC<ActivityPanelProps> = ({ symbol }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Trade');

  const renderContent = () => {
    switch (activeTab) {
      case 'Trade':
        return <TradePanel symbol={symbol} />;
      case 'Open Orders':
        return <OpenOrdersPanel />;
      case 'Trade History':
        return <TradeHistoryPanel />;
      default:
        return null;
    }
  };

  const tabs: Tab[] = ['Trade', 'Open Orders', 'Trade History'];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default ActivityPanel; 