
import React, { useState, useCallback } from 'react';
import { DataProvider } from './contexts/DataContext';
import StaffManagement from './pages/StaffManagement';
import Reports from './pages/Reports';
import Header from './components/Header';
import { FileText, Users, BarChart2, Home } from 'lucide-react';

type Page = 'dashboard' | 'staff' | 'reports';

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>('dashboard');

    const renderPage = useCallback(() => {
        switch (activePage) {
            case 'staff':
                return <StaffManagement />;
            case 'reports':
                return <Reports />;
            case 'dashboard':
            default:
                return <Dashboard setActivePage={setActivePage} />;
        }
    }, [activePage]);

    const NavItem = ({ page, icon, label }: { page: Page, icon: React.ReactNode, label: string }) => (
        <li className="mb-2">
            <button
                onClick={() => setActivePage(page)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activePage === page
                        ? 'bg-primary-700 text-white shadow-md'
                        : 'text-gray-300 hover:bg-primary-600 hover:text-white'
                }`}
            >
                {icon}
                <span className="ml-4 font-semibold">{label}</span>
            </button>
        </li>
    );

    return (
        <DataProvider>
            <div className="flex h-screen bg-gray-50 font-sans">
                <aside className="w-64 bg-primary-800 text-white flex flex-col p-4 shadow-2xl">
                    <div className="text-2xl font-bold p-4 border-b border-primary-700 mb-6 text-center">
                        BTELS
                    </div>
                    <nav>
                        <ul>
                           <NavItem page="dashboard" icon={<Home size={20} />} label="Dashboard" />
                           <NavItem page="staff" icon={<Users size={20} />} label="Staff Management" />
                           <NavItem page="reports" icon={<BarChart2 size={20} />} label="Reports" />
                        </ul>
                    </nav>
                </aside>
                <main className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <div className="flex-1 p-6 overflow-y-auto">
                        {renderPage()}
                    </div>
                </main>
            </div>
        </DataProvider>
    );
};

const Dashboard: React.FC<{ setActivePage: (page: Page) => void }> = ({ setActivePage }) => (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome to the Baduriya Teachers Emergency Loan Scheme Management System.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard 
                title="Staff Management" 
                description="Add, view, and manage staff profiles and their financial history."
                icon={<Users className="w-12 h-12 text-primary-500" />}
                onClick={() => setActivePage('staff')}
            />
            <DashboardCard 
                title="Reports" 
                description="Generate and view detailed financial reports and summaries."
                icon={<BarChart2 className="w-12 h-12 text-primary-500" />}
                onClick={() => setActivePage('reports')}
            />
        </div>
    </div>
);

const DashboardCard: React.FC<{title: string, description: string, icon: React.ReactNode, onClick: () => void}> = ({ title, description, icon, onClick }) => (
    <div onClick={onClick} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 flex flex-col items-center text-center">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500">{description}</p>
    </div>
);


export default App;
