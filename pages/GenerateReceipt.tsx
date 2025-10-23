import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { numberToWords, generateUniqueId, formatDate } from '../utils/helpers';
import { AnyTransaction, DepositSubType, PaymentMethod, SavingType, Staff, TransactionType, WithdrawalSubType, GiveLoanTransaction } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SCHOOL_NAME, SCHEME_NAME, CURRENCY_SYMBOL } from '../constants';


interface GenerateReceiptProps {
    isOpen: boolean;
    onClose: () => void;
}

const GenerateReceipt: React.FC<GenerateReceiptProps> = ({ isOpen, onClose }) => {
    const { appState, addTransaction } = useData();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [staffId, setStaffId] = useState('');
    const [amount, setAmount] = useState('');
    const [amountInWords, setAmountInWords] = useState('');
    const [paymentType, setPaymentType] = useState<TransactionType>(TransactionType.DEPOSIT);
    
    // Deposit states
    const [depositSubType, setDepositSubType] = useState<DepositSubType>(DepositSubType.SAVING);
    const [depositSavingType, setDepositSavingType] = useState<SavingType>(SavingType.NORMAL_DEPOSIT);
    const [depositPaymentMethod, setDepositPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [linkedLoanId, setLinkedLoanId] = useState('');
    
    // Withdrawal states
    const [withdrawalSubType, setWithdrawalSubType] = useState<WithdrawalSubType>(WithdrawalSubType.GIVE_LOAN);
    const [withdrawalSavingType, setWithdrawalSavingType] = useState<SavingType>(SavingType.NORMAL_DEPOSIT);
    const [withdrawalPaymentMethod, setWithdrawalPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [interestRate, setInterestRate] = useState('0');
    const [repaymentPlan, setRepaymentPlan] = useState('Monthly Installments');
    
    const activeLoans = appState.transactions.filter(t => t.staffId === staffId && t.type === TransactionType.WITHDRAWAL && t.subType === WithdrawalSubType.GIVE_LOAN && t.status === 'Active') as GiveLoanTransaction[];

    useEffect(() => {
        if (amount) {
            setAmountInWords(numberToWords(amount));
        } else {
            setAmountInWords('');
        }
    }, [amount]);

    const resetForm = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setStaffId('');
        setAmount('');
        // ... reset all other states
    };
    
    const generateAndDownloadPdf = (transaction: AnyTransaction, staff: Staff) => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(SCHEME_NAME, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(SCHOOL_NAME, 105, 28, { align: 'center' });
        doc.line(20, 32, 190, 32);

        doc.setFontSize(14);
        doc.text('Official Receipt', 105, 40, { align: 'center' });

        autoTable(doc, {
            startY: 50,
            theme: 'plain',
            body: [
                ['Receipt ID:', transaction.receiptId],
                ['Date:', formatDate(transaction.date)],
                ['Staff Name:', staff.name],
                ['Staff ID:', staff.id],
            ],
            styles: { fontSize: 11 }
        });

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Description', 'Details']],
            body: [
                ['Transaction Type', `${transaction.type} - ${transaction.subType}`],
                ['Amount', `${CURRENCY_SYMBOL} ${transaction.amount.toFixed(2)}`],
                ['Amount in Words', numberToWords(transaction.amount)],
                ['Payment Method', transaction.paymentMethod],
            ],
            theme: 'striped',
            headStyles: { fillColor: [22, 160, 133] },
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        doc.text('........................................', 30, finalY + 30);
        doc.text('........................................', 140, finalY + 30);
        doc.text('Authorized Signature', 35, finalY + 37);
        doc.text('Recipient Signature', 145, finalY + 37);

        doc.save(`receipt-${transaction.receiptId}.pdf`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const staff = appState.staff.find(s => s.id === staffId);
        if (!staff) {
            alert("Please select a valid staff member.");
            return;
        }

        const receiptId = generateUniqueId('RCPT');
        let newTransaction: AnyTransaction | null = null;
        
        const baseData = {
            receiptId,
            staffId,
            date: new Date(date).toISOString(),
            amount: parseFloat(amount)
        };
        
        if (paymentType === TransactionType.DEPOSIT) {
            // FIX: Use `as const` to prevent type widening for the 'type' property.
            const commonDeposit = { ...baseData, type: TransactionType.DEPOSIT as const, paymentMethod: depositSubType === DepositSubType.MEMBERSHIP ? PaymentMethod.CASH : depositPaymentMethod };
            switch(depositSubType) {
                case DepositSubType.SAVING:
                    newTransaction = { ...commonDeposit, subType: DepositSubType.SAVING, savingType: depositSavingType };
                    break;
                case DepositSubType.LOAN_SETTLEMENT:
                    if (!linkedLoanId) { alert("Please select a loan to settle."); return; }
                    newTransaction = { ...commonDeposit, subType: DepositSubType.LOAN_SETTLEMENT, linkedLoanId };
                    break;
                case DepositSubType.DONATION:
                     newTransaction = { ...commonDeposit, subType: DepositSubType.DONATION };
                    break;
                case DepositSubType.MEMBERSHIP:
                     newTransaction = { ...commonDeposit, subType: DepositSubType.MEMBERSHIP, paymentMethod: PaymentMethod.CASH };
                    break;
            }
        } else { // WITHDRAWAL
            // FIX: Use `as const` to prevent type widening for the 'type' property.
             const commonWithdrawal = { ...baseData, type: TransactionType.WITHDRAWAL as const, paymentMethod: withdrawalPaymentMethod };
             switch(withdrawalSubType) {
                 case WithdrawalSubType.GIVE_LOAN:
                    const loanId = generateUniqueId('LOAN');
                    newTransaction = { ...commonWithdrawal, subType: WithdrawalSubType.GIVE_LOAN, interestRate: parseFloat(interestRate), repaymentSchedule: repaymentPlan, loanId, status: 'Active' };
                    break;
                 case WithdrawalSubType.SAVING_WITHDRAWAL:
                    newTransaction = { ...commonWithdrawal, subType: WithdrawalSubType.SAVING_WITHDRAWAL, savingType: withdrawalSavingType };
                    break;
             }
        }
        
        if (newTransaction) {
            addTransaction(newTransaction);
            generateAndDownloadPdf(newTransaction, staff);
            alert(`Receipt ${receiptId} generated successfully!`);
            resetForm();
            onClose();
        }
    };
    
    const renderDepositOptions = () => (
        <>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Deposit For</label>
                <select value={depositSubType} onChange={(e) => setDepositSubType(e.target.value as DepositSubType)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                    {Object.values(DepositSubType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {depositSubType === DepositSubType.SAVING && (
                <>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Saving Type</label>
                    <select value={depositSavingType} onChange={(e) => setDepositSavingType(e.target.value as SavingType)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        {Object.values(SavingType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                </>
            )}

            {depositSubType === DepositSubType.LOAN_SETTLEMENT && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Linked Loan</label>
                    <select value={linkedLoanId} onChange={(e) => setLinkedLoanId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required>
                         <option value="">Select an active loan</option>
                         {activeLoans.map(loan => <option key={loan.loanId} value={loan.loanId}>Loan of {loan.amount} on {formatDate(loan.date)}</option>)}
                    </select>
                </div>
            )}
            
             {depositSubType !== DepositSubType.MEMBERSHIP && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <div className="flex gap-4 mt-1">
                        <label><input type="radio" value={PaymentMethod.CASH} checked={depositPaymentMethod === PaymentMethod.CASH} onChange={() => setDepositPaymentMethod(PaymentMethod.CASH)} /> Cash</label>
                        <label><input type="radio" value={PaymentMethod.BANK_DEPOSIT} checked={depositPaymentMethod === PaymentMethod.BANK_DEPOSIT} onChange={() => setDepositPaymentMethod(PaymentMethod.BANK_DEPOSIT)} /> Bank Deposit</label>
                    </div>
                </div>
            )}
        </>
    );

     const renderWithdrawalOptions = () => (
        <>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Withdrawal For</label>
                <select value={withdrawalSubType} onChange={(e) => setWithdrawalSubType(e.target.value as WithdrawalSubType)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                    {Object.values(WithdrawalSubType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
             {withdrawalSubType === WithdrawalSubType.GIVE_LOAN && (
                <>
                    <div className="mb-4 grid grid-cols-2 gap-4">
                       <div>
                            <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                            <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                       </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Repayment Plan</label>
                            <input type="text" value={repaymentPlan} onChange={e => setRepaymentPlan(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                </>
            )}
             {withdrawalSubType === WithdrawalSubType.SAVING_WITHDRAWAL && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Saving Type</label>
                    <select value={withdrawalSavingType} onChange={(e) => setWithdrawalSavingType(e.target.value as SavingType)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        {Object.values(SavingType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            )}
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <div className="flex gap-4 mt-1">
                    <label><input type="radio" value={PaymentMethod.CASH} checked={withdrawalPaymentMethod === PaymentMethod.CASH} onChange={() => setWithdrawalPaymentMethod(PaymentMethod.CASH)} /> Cash</label>
                    <label><input type="radio" value={PaymentMethod.CHEQUE} checked={withdrawalPaymentMethod === PaymentMethod.CHEQUE} onChange={() => setWithdrawalPaymentMethod(PaymentMethod.CHEQUE)} /> Cheque</label>
                </div>
            </div>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Receipt">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Staff Name</label>
                        <select value={staffId} onChange={e => setStaffId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required>
                            <option value="">Select Staff</option>
                            {appState.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-700">Amount ({CURRENCY_SYMBOL})</label>
                     <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                     <p className="text-sm text-gray-500 mt-1">{amountInWords || 'Amount in words will appear here'}</p>
                </div>
                
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                     <div className="flex gap-4 mt-1">
                        <label><input type="radio" value={TransactionType.DEPOSIT} checked={paymentType === TransactionType.DEPOSIT} onChange={() => setPaymentType(TransactionType.DEPOSIT)} /> Deposit</label>
                        <label><input type="radio" value={TransactionType.WITHDRAWAL} checked={paymentType === TransactionType.WITHDRAWAL} onChange={() => setPaymentType(TransactionType.WITHDRAWAL)} /> Withdrawal</label>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-md border">
                    {paymentType === TransactionType.DEPOSIT ? renderDepositOptions() : renderWithdrawalOptions()}
                </div>
                
                <div className="flex justify-end pt-6">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 mr-2">Cancel</button>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Generate & Save</button>
                </div>
            </form>
        </Modal>
    );
};

export default GenerateReceipt;