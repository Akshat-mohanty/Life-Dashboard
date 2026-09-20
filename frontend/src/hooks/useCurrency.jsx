import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar (SG$)' },
];

export const DEFAULT_CURRENCY = 'INR';

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Isolated key strictly per user
  const storageKey = user?.userId ? `life_dashboard_currency_${user.userId}` : 'life_dashboard_currency_guest';

  const [currencyCode, setCurrencyCodeState] = useState(() => {
    if (user?.userId) {
      const saved = localStorage.getItem(`life_dashboard_currency_${user.userId}`);
      if (saved) return saved;
      if (user?.defaultCurrency) return user.defaultCurrency;
    }
    return DEFAULT_CURRENCY;
  });

  // Whenever user changes, switch immediately to that specific user's isolated currency
  useEffect(() => {
    if (user?.userId) {
      const saved = localStorage.getItem(`life_dashboard_currency_${user.userId}`);
      if (saved) {
        setCurrencyCodeState(saved);
      } else if (user?.defaultCurrency) {
        setCurrencyCodeState(user.defaultCurrency);
      } else {
        setCurrencyCodeState(DEFAULT_CURRENCY);
      }
    } else {
      setCurrencyCodeState(DEFAULT_CURRENCY);
    }
  }, [user?.userId, user?.defaultCurrency]);

  const setCurrency = (code) => {
    const validCurrency = CURRENCIES.find((c) => c.code === code);
    const chosenCode = validCurrency ? validCurrency.code : DEFAULT_CURRENCY;
    setCurrencyCodeState(chosenCode);
    if (user?.userId) {
      localStorage.setItem(`life_dashboard_currency_${user.userId}`, chosenCode);
    }
  };

  const activeCurrency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const currencySymbol = activeCurrency.symbol;

  /**
   * Helper function to format amount with active user's currency symbol and proper locale formatting
   */
  const formatAmount = (amount, options = {}) => {
    const numeric = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    const formattedNum = numeric.toLocaleString(locale, {
      minimumFractionDigits: options.decimals !== undefined ? options.decimals : 0,
      maximumFractionDigits: options.decimals !== undefined ? options.decimals : 2,
    });
    return `${currencySymbol}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency: activeCurrency,
        currencyCode: activeCurrency.code,
        currencySymbol,
        setCurrency,
        formatAmount,
        availableCurrencies: CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      currency: CURRENCIES[0],
      currencyCode: 'INR',
      currencySymbol: '₹',
      setCurrency: () => {},
      formatAmount: (val) => `₹${(typeof val === 'number' ? val : parseFloat(val) || 0).toLocaleString('en-IN')}`,
      availableCurrencies: CURRENCIES,
    };
  }
  return ctx;
};
