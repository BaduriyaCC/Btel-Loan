
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Staff, Designation, AnyTransaction, DepositSubType, WithdrawalSubType, TransactionType } from '../types';
import { DESIGNATION_OPTIONS, CURRENCY_SYMBOL } from '../constants';
import { generateUniqueId, formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, User, ChevronsUpDown, Trash2 } from 'lucide-react';

const StaffManagement: React.FC = () => {
    const { appState, addStaff } = useData();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStaff = useMemo(() => {
        return appState.staff.filter(staff =>
            staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [appState.staff, searchTerm]);

    const handleAddStaff = (newStaff: Omit<Staff, 'id'>) => {
        const staffId = generateUniqueId('ST');
        addStaff({ ...newStaff, id: staffId });
        setModalOpen(false);
    };
    
    const handleSelectStaff = (staff: Staff) => {
        setSelectedStaff(staff);
    };

    if (selectedStaff) {
        return <StaffProfile staff={selectedStaff} onBack={() => setSelectedStaff(null)} transactions={appState.transactions} />;
    }

    return (
        <div className="p-2">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
                 <button
                    onClick={() => setModalOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> Add Staff
                </button>
            </div>
            
            <div className="mb-4">
                 <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact No</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStaff.map(staff => (
                            <tr key={staff.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.designation}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.contactNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleSelectStaff(staff)} className="text-primary-600 hover:text-primary-900">View Profile</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredStaff.length === 0 && <p className="text-center text-gray-500 py-4">No staff found.</p>}
            </div>

            <AddStaffModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onAddStaff={handleAddStaff} existingStaffIds={appState.staff.map(s => s.id)} />
        </div>
    );
};


const AddStaffModal: React.FC<{ isOpen: boolean; onClose: () => void; onAddStaff: (staff: Omit<Staff, 'id'>) => void; existingStaffIds: string[] }> = ({ isOpen, onClose, onAddStaff, existingStaffIds }) => {
    const [formData, setFormData] = useState({
        name: '',
        staffId: '', // Keep for manual entry if needed, but we auto-generate
        address: '',
        designation: Designation.TEACHER,
        otherDesignation: '',
        joinDate: '',
        contactNo: ''
    });
    
    const [staffId, setStaffId] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you can add validation
        onAddStaff({
            name: formData.name,
            address: formData.address,
            designation: formData.designation,
            otherDesignation: formData.designation === Designation.OTHER ? formData.otherDesignation : undefined,
            joinDate: new Date(formData.joinDate).toISOString(),
            contactNo: formData.contactNo
        });
        // Reset form
        setFormData({
            name: '', staffId: '', address: '', designation: Designation.TEACHER, otherDesignation: '', joinDate: '', contactNo: ''
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Staff">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name of Staff</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <select name="designation" value={formData.designation} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                        {DESIGNATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                {formData.designation === Designation.OTHER && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Specify Other Designation</label>
                        <input type="text" name="otherDesignation" value={formData.otherDesignation} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Join</label>
                        <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contact No (e.g., 077-1234567)</label>
                        <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} pattern="[0-9]{3}-[0-9]{7}" placeholder="XXX-XXXXXXX" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 mr-2">Cancel</button>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add Staff</button>
                </div>
            </form>
        </Modal>
    );
};

const StaffProfile: React.FC<{ staff: Staff; onBack: () => void; transactions: AnyTransaction[] }> = ({ staff, onBack, transactions }) => {
    
    const staffTransactions = useMemo(() => transactions.filter(t => t.staffId === staff.id), [transactions, staff.id]);

    const savings = useMemo(() => {
        const deposits = staffTransactions.filter(t => t.type === 'Deposit' && t.subType === 'Saving').reduce((sum, t) => sum + t.amount, 0);
        const withdrawals = staffTransactions.filter(t => t.type === 'Withdrawal' && t.subType === 'Saving Withdrawal').reduce((sum, t) => sum + t.amount, 0);
        const lastDeposit = staffTransactions.filter(t => t.type === 'Deposit' && t.subType === 'Saving').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const lastWithdrawal = staffTransactions.filter(t => t.type === 'Withdrawal' && t.subType === 'Saving Withdrawal').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        return {
            balance: deposits - withdrawals,
            lastDepositDate: lastDeposit ? formatDate(lastDeposit.date) : 'N/A',
            lastWithdrawalDate: lastWithdrawal ? formatDate(lastWithdrawal.date) : 'N/A',
        };
    }, [staffTransactions]);
    
    const loans = useMemo(() => {
        const activeLoans = staffTransactions.filter(t => t.type === 'Withdrawal' && t.subType === 'Give Loan' && t.status === 'Active');
        const outstanding = activeLoans.reduce((total, loan) => {
            const payments = staffTransactions.filter(t => t.type === 'Deposit' && t.subType === 'Loan Settlement' && t.linkedLoanId === loan.loanId).reduce((sum, p) => sum + p.amount, 0);
            return total + (loan.amount - payments);
        }, 0);
        const lastPayment = staffTransactions.filter(t => t.type === 'Deposit' && t.subType === 'Loan Settlement').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return {
            outstanding,
            activeLoanCount: activeLoans.length,
            lastPaymentDate: lastPayment ? formatDate(lastPayment.date) : 'N/A',
        };
    }, [staffTransactions]);

    const donations = useMemo(() => {
        const total = staffTransactions.filter(t => t.type === 'Deposit' && t.subType === 'Donation').reduce((sum, t) => sum + t.amount, 0);
        const lastDonation = staffTransactions.filter(t => t.type === 'Deposit' && t.subType === 'Donation').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return {
            total,
            lastDonationDate: lastDonation ? formatDate(lastDonation.date) : 'N/A'
        };
    }, [staffTransactions]);

    const membership = useMemo(() => {
        const lastPayment = staffTransactions.filter(t => t.type === 'Deposit' && t.subType === 'Membership').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return {
            status: lastPayment ? 'Active' : 'Inactive', // Simplified
            lastPaymentDate: lastPayment ? formatDate(lastPayment.date) : 'N/A',
            nextDueDate: lastPayment ? new Date(new Date(lastPayment.date).setMonth(new Date(lastPayment.date).getMonth() + 1)).toLocaleDateString('en-CA') : 'N/A'
        };
    }, [staffTransactions]);

    return (
        <div>
            <button onClick={onBack} className="mb-4 text-primary-600 hover:underline">
                &larr; Back to Staff List
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center space-x-4 pb-4 border-b">
                    <div className="bg-primary-100 text-primary-600 rounded-full w-16 h-16 flex items-center justify-center">
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{staff.name}</h2>
                        <p className="text-gray-500">{staff.id} | {staff.designation === 'Other' ? staff.otherDesignation : staff.designation}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <p><strong className="text-gray-600">Address:</strong> {staff.address}</p>
                    <p><strong className="text-gray-600">Contact:</strong> {staff.contactNo}</p>
                    <p><strong className="text-gray-600">Joined On:</strong> {formatDate(staff.joinDate)}</p>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Account History Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard title="Savings" value={`${CURRENCY_SYMBOL} ${savings.balance.toFixed(2)}`} details={[`Last Deposit: ${savings.lastDepositDate}`, `Last Withdrawal: ${savings.lastWithdrawalDate}`]} />
                    <SummaryCard title="Loans" value={`${CURRENCY_SYMBOL} ${loans.outstanding.toFixed(2)}`} details={[`Active Loans: ${loans.activeLoanCount}`, `Last Payment: ${loans.lastPaymentDate}`]} />
                    <SummaryCard title="Donations" value={`${CURRENCY_SYMBOL} ${donations.total.toFixed(2)}`} details={[`Last Donation: ${donations.lastDonationDate}`]} />
                    <SummaryCard title="Membership" value={membership.status} details={[`Last Payment: ${membership.lastPaymentDate}`, `Next Due: ${membership.nextDueDate}`]} />
                </div>
            </div>

            <div className="mt-6">
                <TransactionTable title="Savings History" transactions={staffTransactions.filter(t => t.subType === 'Saving' || t.subType === 'Saving Withdrawal')} />
                <TransactionTable title="Loan History" transactions={staffTransactions.filter(t => t.subType === 'Give Loan' || t.subType === 'Loan Settlement')} />
                <TransactionTable title="Donation History" transactions={staffTransactions.filter(t => t.subType === 'Donation')} />
                <TransactionTable title="Membership History" transactions={staffTransactions.filter(t => t.subType === 'Membership')} />
            </div>
        </div>
    );
};

const SummaryCard: React.FC<{title: string, value: string, details: string[]}> = ({ title, value, details }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <div className="mt-2 text-xs text-gray-500 space-y-1">
            {details.map((d, i) => <p key={i}>{d}</p>)}
        </div>
    </div>
);

const TransactionTable: React.FC<{title: string, transactions: AnyTransaction[]}> = ({ title, transactions }) => {
    if(transactions.length === 0) return null;
    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <h4 className="px-6 py-3 text-lg font-semibold text-gray-700 bg-gray-50 border-b">{title}</h4>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount ({CURRENCY_SYMBOL})</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt ID</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map(t => (
                        <tr key={t.receiptId}>
                            <td className="px-6 py-4 text-sm">{formatDate(t.date)}</td>
                            <td className="px-6 py-4 text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === TransactionType.DEPOSIT ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {t.subType}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm">{t.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm">{t.paymentMethod}</td>
                            <td className="px-6 py-4 text-sm">{t.receiptId}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
};


export default StaffManagement;
