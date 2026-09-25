import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const EXCHANGE_RATE_USD_BDT = 120; // 1 USD = 120 BDT

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('whiz_currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('whiz_currency', currency);
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency(prev => (prev === 'USD' ? 'BDT' : 'USD'));
  };

  const formatAmount = (usdValue, options = {}) => {
    const { compact = false, showSymbol = true } = options;
    if (currency === 'BDT') {
      const bdtValue = usdValue * EXCHANGE_RATE_USD_BDT;
      if (compact) {
        if (bdtValue >= 10000000) return `${showSymbol ? '৳' : ''}${(bdtValue / 10000000).toFixed(1)}Cr`;
        if (bdtValue >= 100000) return `${showSymbol ? '৳' : ''}${(bdtValue / 100000).toFixed(1)}L`;
        if (bdtValue >= 1000) return `${showSymbol ? '৳' : ''}${(bdtValue / 1000).toFixed(0)}k`;
      }
      return `${showSymbol ? '৳' : ''}${Math.round(bdtValue).toLocaleString('en-US')}`;
    } else {
      if (compact) {
        if (usdValue >= 1000000) return `${showSymbol ? '$' : ''}${(usdValue / 1000000).toFixed(1)}M`;
        if (usdValue >= 1000) return `${showSymbol ? '$' : ''}${(usdValue / 1000).toFixed(1)}k`;
      }
      return `${showSymbol ? '$' : ''}${Math.round(usdValue).toLocaleString('en-US')}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency, formatAmount, exchangeRate: EXCHANGE_RATE_USD_BDT }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
