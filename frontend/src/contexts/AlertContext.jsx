import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';
import ConfirmModal from '../components/ConfirmModal';

// 1. Create the context
const AlertContext = createContext();

// 2. Custom hook to use the context
export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

/**
 * AlertProvider component manages the global alert and confirm states.
 */
export const AlertProvider = ({ children }) => {
    // --- ALERT STATE LOGIC ---
    const [alerts, setAlerts] = useState([]);

    const showAlert = useCallback((message, type = 'info') => {
        const validTypes = ['success', 'error', 'warning', 'info'];
        const finalType = validTypes.includes(type) ? type : 'info';

        const newAlert = {
            id: Date.now(),
            message,
            type: finalType
        };

        setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
    }, []);

    const dismissAlert = useCallback((id) => {
        setAlerts((prevAlerts) => prevAlerts.filter(alert => alert.id !== id));
    }, []);

    // --- CONFIRM MODAL LOGIC ---
    const [confirmState, setConfirmState] = useState({
        show: false,
        title: '',
        message: '',
        resolve: null, // Function to resolve the promise
    });

    // The function components will call: await confirm({ title: "...", message: "..." })
    const confirm = useCallback(({ title = 'Confirm Action', message = 'Are you sure you want to proceed?' }) => {
        // Return a promise that resolves to true (Confirmed) or false (Cancelled)
        return new Promise((resolve) => {
            setConfirmState({
                show: true,
                title,
                message,
                resolve: resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (confirmState.resolve) {
            confirmState.resolve(true); // Resolve with true (Confirmed)
        }
        setConfirmState({ show: false, title: '', message: '', resolve: null }); // Reset state
    }, [confirmState]);

    const handleCancel = useCallback(() => {
        if (confirmState.resolve) {
            confirmState.resolve(false); // Resolve with false (Cancelled)
        }
        setConfirmState({ show: false, title: '', message: '', resolve: null }); // Reset state
    }, [confirmState]);

    // Value exposed to components
    const contextValue = {
        showAlert,
        confirm, // Expose the promise-based confirm function
    };

    return (
        <AlertContext.Provider value={contextValue}>
            {children}

            {/* Render a container for multiple alerts */}
            <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50 p-4 space-y-2">
                {alerts.map((alert) => (
                    <CustomAlert
                        key={alert.id}
                        alert={alert}
                        onDismiss={() => dismissAlert(alert.id)}
                    />
                ))}
            </div>

            {/* Render the global ConfirmModal */}
            <ConfirmModal
                show={confirmState.show}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </AlertContext.Provider>
    );
};