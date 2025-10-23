
import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppState, Staff, AnyTransaction } from '../types';

interface DataContextType {
    appState: AppState;
    setAppState: (state: AppState) => void;
    addStaff: (staff: Staff) => void;
    addTransaction: (transaction: AnyTransaction) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialState: AppState = {
    staff: [],
    transactions: [],
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useLocalStorage<AppState>('btels-data', initialState);

    const addStaff = (newStaff: Staff) => {
        setAppState({
            ...appState,
            staff: [...appState.staff, newStaff],
        });
    };

    const addTransaction = (newTransaction: AnyTransaction) => {
        const updatedTransactions = [...appState.transactions, newTransaction];
        
        // Update loan status if it's a settlement
        if (newTransaction.type === 'Deposit' && newTransaction.subType === 'Loan Settlement') {
             const { linkedLoanId } = newTransaction;
             // find original loan
             const loanIndex = updatedTransactions.findIndex(t => t.type === 'Withdrawal' && t.subType === 'Give Loan' && t.loanId === linkedLoanId);
             if (loanIndex !== -1) {
                const originalLoan = updatedTransactions[loanIndex];
                if(originalLoan.type === 'Withdrawal' && originalLoan.subType === 'Give Loan'){
                    const payments = updatedTransactions.filter(t => t.type === 'Deposit' && t.subType === 'Loan Settlement' && t.linkedLoanId === linkedLoanId);
                    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

                    if (totalPaid >= originalLoan.amount) {
                         // This is a simplified settlement logic. A real system would calculate interest.
                        (updatedTransactions[loanIndex] as any).status = 'Settled';
                    }
                }
             }
        }

        setAppState({
            ...appState,
            transactions: updatedTransactions,
        });
    };
    
    const value = { appState, setAppState, addStaff, addTransaction };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
