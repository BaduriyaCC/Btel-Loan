
export enum Designation {
    TEACHER = 'Teacher',
    DEPUTY_PRINCIPAL = 'Deputy Principal',
    VICE_PRINCIPAL = 'Vice Principal',
    SECTIONAL_HEAD = 'Sectional Head',
    DEVELOPMENT_OFFICER = 'Development Officer',
    MANAGEMENT_ASSISTANT = 'Management Assistant',
    OFFICE_ASSISTANT = 'Office Assistant',
    SPORTS_COACH = 'Sports Coach',
    WATCHER = 'Watcher',
    OTHER = 'Other',
}

export interface Staff {
    id: string; // Staff ID
    name: string;
    address: string;
    designation: Designation;
    otherDesignation?: string;
    joinDate: string; // ISO string format
    contactNo: string;
}

export enum PaymentMethod {
    CASH = 'Cash',
    BANK_DEPOSIT = 'Bank Deposit',
    CHEQUE = 'Cheque',
}

export enum TransactionType {
    DEPOSIT = 'Deposit',
    WITHDRAWAL = 'Withdrawal',
}

export enum DepositSubType {
    LOAN_SETTLEMENT = 'Loan Settlement',
    SAVING = 'Saving',
    DONATION = 'Donation',
    MEMBERSHIP = 'Membership',
}

export enum WithdrawalSubType {
    GIVE_LOAN = 'Give Loan',
    SAVING_WITHDRAWAL = 'Saving Withdrawal',
}

export enum SavingType {
    FIX_DEPOSIT = 'Fix Deposit',
    NORMAL_DEPOSIT = 'Normal Deposit',
}

export interface BaseTransaction {
    receiptId: string;
    staffId: string;
    date: string; // ISO string format
    amount: number;
}

export interface DepositTransaction extends BaseTransaction {
    type: TransactionType.DEPOSIT;
    subType: DepositSubType;
    paymentMethod: PaymentMethod.CASH | PaymentMethod.BANK_DEPOSIT;
    savingType?: SavingType;
    linkedLoanId?: string;
}

export interface LoanSettlementTransaction extends DepositTransaction {
    subType: DepositSubType.LOAN_SETTLEMENT;
    linkedLoanId: string;
}

export interface SavingTransaction extends DepositTransaction {
    subType: DepositSubType.SAVING;
    savingType: SavingType;
}

export interface DonationTransaction extends DepositTransaction {
    subType: DepositSubType.DONATION;
}

export interface MembershipTransaction extends DepositTransaction {
    subType: DepositSubType.MEMBERSHIP;
    paymentMethod: PaymentMethod.CASH;
}

export interface WithdrawalTransaction extends BaseTransaction {
    type: TransactionType.WITHDRAWAL;
    subType: WithdrawalSubType;
    paymentMethod: PaymentMethod.CASH | PaymentMethod.CHEQUE;
}

export interface GiveLoanTransaction extends WithdrawalTransaction {
    subType: WithdrawalSubType.GIVE_LOAN;
    interestRate: number;
    repaymentSchedule: string;
    loanId: string; // a new unique id for the loan itself
    status: 'Active' | 'Settled';
}

export interface SavingWithdrawalTransaction extends WithdrawalTransaction {
    subType: WithdrawalSubType.SAVING_WITHDRAWAL;
    savingType: SavingType;
}

export type AnyTransaction = LoanSettlementTransaction | SavingTransaction | DonationTransaction | MembershipTransaction | GiveLoanTransaction | SavingWithdrawalTransaction;

export interface AppState {
    staff: Staff[];
    transactions: AnyTransaction[];
}
