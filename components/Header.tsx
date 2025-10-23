
import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Download, Upload, PlusCircle } from 'lucide-react';
import { SCHOOL_NAME, SCHEME_NAME } from '../constants';
import GenerateReceipt from '../pages/GenerateReceipt';

const Header: React.FC = () => {
    const { appState, setAppState } = useData();
    const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(appState, null, 2)
        )}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `btels_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text === 'string') {
                        const importedState = JSON.parse(text);
                        // Basic validation
                        if (importedState.staff && importedState.transactions) {
                             if (window.confirm('Are you sure you want to import this data? This will overwrite all current data.')) {
                                setAppState(importedState);
                                alert('Data imported successfully!');
                            }
                        } else {
                            alert('Invalid data file format.');
                        }
                    }
                } catch (error) {
                    alert('Error reading or parsing the file.');
                    console.error(error);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <>
            <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{SCHEME_NAME}</h1>
                    <p className="text-sm text-gray-500">{SCHOOL_NAME}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setReceiptModalOpen(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition flex items-center gap-2"
                    >
                        <PlusCircle size={18} /> Generate Receipt
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition flex items-center gap-2"
                    >
                         <Upload size={18} /> Import
                    </button>
                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={handleExport}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition flex items-center gap-2"
                    >
                        <Download size={18} /> Export
                    </button>
                </div>
            </header>
            <GenerateReceipt isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} />
        </>
    );
};

export default Header;
