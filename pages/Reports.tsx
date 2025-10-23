
import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { AnyTransaction, PaymentMethod, TransactionType } from '../types';
import { formatDate } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports: React.FC = () => {
    const { appState } = useData();
    const { staff, transactions } = appState;
    const [filter, setFilter] = useState({
        startDate: '',
        endDate: '',
        staffId: '',
        transactionType: '',
    });

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const startDate = filter.startDate ? new Date(filter.startDate) : null;
            const endDate = filter.endDate ? new Date(filter.endDate) : null;

            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;
            if (filter.staffId && t.staffId !== filter.staffId) return false;
            if (filter.transactionType && t.type !== filter.transactionType) return false;

            return true;
        });
    }, [transactions, filter]);
    
    const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s.name])), [staff]);

    const handleExportCSV = () => {
        const headers = ['Receipt ID', 'Date', 'Staff Name', 'Staff ID', 'Transaction Type', 'Sub-Type', 'Amount (LKR)', 'Payment Method', 'Status'];
        const rows = filteredTransactions.map(t => {
            const loanStatus = (t.type === 'Withdrawal' && t.subType === 'Give Loan') ? t.status : 'N/A';
            return [
                t.receiptId,
                formatDate(t.date),
                staffMap.get(t.staffId) || 'Unknown',
                t.staffId,
                t.type,
                t.subType,
                t.amount,
                t.paymentMethod,
                loanStatus
            ].join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "transactions_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const financialSummary = useMemo(() => {
        let totalLoanDisbursed = 0;
        let totalLoanRepayments = 0;
        let totalSavingsDeposits = 0;
        let totalSavingsWithdrawals = 0;
        let totalDonations = 0;
        let totalMembership = 0;
        let cashBalance = 0;
        let bankBalance = 0;

        transactions.forEach(t => {
            if (t.type === 'Deposit') {
                if (t.paymentMethod === PaymentMethod.CASH) cashBalance += t.amount;
                if (t.paymentMethod === PaymentMethod.BANK_DEPOSIT) bankBalance += t.amount;

                if (t.subType === 'Loan Settlement') totalLoanRepayments += t.amount;
                if (t.subType === 'Saving') totalSavingsDeposits += t.amount;
                if (t.subType === 'Donation') totalDonations += t.amount;
                if (t.subType === 'Membership') totalMembership += t.amount;
            } else { // Withdrawal
                if (t.paymentMethod === PaymentMethod.CASH) cashBalance -= t.amount;
                if (t.paymentMethod === PaymentMethod.CHEQUE) bankBalance -= t.amount;

                if (t.subType === 'Give Loan') totalLoanDisbursed += t.amount;
                if (t.subType === 'Saving Withdrawal') totalSavingsWithdrawals += t.amount;
            }
        });

        return {
            totalLoanDisbursed, totalLoanRepayments, totalSavingsDeposits, totalSavingsWithdrawals,
            totalDonations, totalMembership, cashBalance, bankBalance,
            totalSchemeFunds: cashBalance + bankBalance,
        };
    }, [transactions]);

    const monthlyChartData = useMemo(() => {
        const dataByMonth: { [key: string]: { name: string, loans: number, savings: number } } = {};
        transactions.forEach(t => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!dataByMonth[month]) dataByMonth[month] = { name: month, loans: 0, savings: 0 };

            if (t.subType === 'Give Loan') dataByMonth[month].loans += t.amount;
            if (t.subType === 'Saving') dataByMonth[month].savings += t.amount;
        });
        return Object.values(dataByMonth).reverse();
    }, [transactions]);


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
            
            {/* Account Balance & Financial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <SummaryCard title="Total Scheme Funds" value={financialSummary.totalSchemeFunds} />
                     <SummaryCard title="System Cash Balance" value={financialSummary.cashBalance} />
                     <SummaryCard title="Bank Deposited Amount" value={financialSummary.bankBalance} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">Detailed Financial Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <DetailItem label="Total Loans Disbursed" value={financialSummary.totalLoanDisbursed} color="text-red-600" />
                        <DetailItem label="Total Loan Repayments" value={financialSummary.totalLoanRepayments} color="text-green-600" />
                        <DetailItem label="Total Savings Deposits" value={financialSummary.totalSavingsDeposits} color="text-green-600" />
                        <DetailItem label="Total Savings Withdrawals" value={financialSummary.totalSavingsWithdrawals} color="text-red-600" />
                        <DetailItem label="Total Donations Received" value={financialSummary.totalDonations} color="text-blue-600" />
                        <DetailItem label="Total Membership Payments" value={financialSummary.totalMembership} color="text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Visualizations */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-700">Monthly Trends (Loans vs Savings Deposits)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `LKR ${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="loans" fill="#ef4444" name="Loans Disbursed" />
                        <Bar dataKey="savings" fill="#22c55e" name="Savings Deposits" />
                    </BarChart>
                </ResponsiveContainer>
            </div>


            {/* Transaction Summary Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Overall Transaction Summary</h3>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-md border">
                    <input type="date" value={filter.startDate} onChange={e => setFilter(f => ({...f, startDate: e.target.value}))} className="p-2 border rounded-md" />
                    <input type="date" value={filter.endDate} onChange={e => setFilter(f => ({...f, endDate: e.target.value}))} className="p-2 border rounded-md" />
                    <select value={filter.staffId} onChange={e => setFilter(f => ({...f, staffId: e.target.value}))} className="p-2 border rounded-md">
                        <option value="">All Staff</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={filter.transactionType} onChange={e => setFilter(f => ({...f, transactionType: e.target.value}))} className="p-2 border rounded-md">
                        <option value="">All Types</option>
                        <option value={TransactionType.DEPOSIT}>Deposit</option>
                        <option value={TransactionType.WITHDRAWAL}>Withdrawal</option>
                    </select>
                </div>
                <button onClick={handleExportCSV} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Export as CSV</button>

                <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt ID</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map(t => (
                                <tr key={t.receiptId}>
                                    <td className="px-4 py-4 text-sm">{formatDate(t.date)}</td>
                                    <td className="px-4 py-4 text-sm">{staffMap.get(t.staffId) || 'N/A'}</td>
                                    <td className="px-4 py-4 text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'Deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {t.subType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm">{t.amount.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-sm">{t.receiptId}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredTransactions.length === 0 && <p className="text-center text-gray-500 py-4">No transactions match the current filters.</p>}
                </div>
            </div>
        </div>
    );
};

const SummaryCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">LKR {value.toFixed(2)}</p>
    </div>
);

const DetailItem: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div>
        <p className="text-gray-500">{label}</p>
        <p className={`font-semibold text-lg ${color}`}>LKR {value.toFixed(2)}</p>
    </div>
);

export default Reports;
