import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Currency = {
    code: string;
    symbol: string;
    name: string;
};

export const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
];

interface CurrencyContextType {
    selectedCurrency: Currency;
    setSelectedCurrency: (currency: Currency) => void;
    formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);

    const formatAmount = (amount: number) => {
        return `${selectedCurrency.symbol}${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    return (
        <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, formatAmount }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}; 