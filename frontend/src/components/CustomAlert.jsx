import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa"; 

/**
 * CustomAlert component displays transient messages at the top of the screen.
 * It implements the 3s auto-dismissal, hover-to-pause, and click-to-dismiss logic.
 */
// The 'alert' prop now includes the 'id'
const CustomAlert = ({ alert, onDismiss }) => {
    const { message, type, id } = alert; // Destructure ID
    const [isHovered, setIsHovered] = useState(false);
    // Renamed from 'isFading' to 'isDismissed' to better reflect the state flow: 
    // it starts the fade-out process.
    const [isDismissed, setIsDismissed] = useState(false); 
    const timeoutRef = useRef(null);
    const ALERT_DURATION_MS = 3000;
    const FADE_DURATION_MS = 500;

    // Define Tailwind classes and icons based on alert type
    const styles = {
// ... (styles object remains the same)
        success: { 
            bg: "bg-green-600 border-green-800", 
            icon: <FaCheck className="w-5 h-5 mr-2" /> 
        },
        error: { 
            bg: "bg-red-600 border-red-800", 
            icon: <FaTimes className="w-5 h-5 mr-2" /> 
        },
        warning: { 
            bg: "bg-yellow-500 border-yellow-700", 
            icon: <FaExclamationTriangle className="w-5 h-5 mr-2" /> 
        },
        info: { 
            bg: "bg-blue-600 border-blue-800", 
            icon: <FaInfoCircle className="w-5 h-5 mr-2" /> 
        },
    };

    const { bg, icon } = styles[type] || styles.info;

    // Logic to start the auto-dismiss timer
    // We make it use ID in dependency array to ensure a new timer for each new alert
    const startTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            if (!isHovered) {
                // Step 1: Start fade-out animation
                setIsDismissed(true); 
                
                // Step 2: Call onDismiss (remove from array) after animation finishes
                setTimeout(onDismiss, FADE_DURATION_MS); 
            }
        }, ALERT_DURATION_MS);
    }, [isHovered, onDismiss, id]); // Added 'id' to restart timer on new alert

    // Primary Timer/Lifecycle Effect
    useEffect(() => {
        // When the alert first mounts or 'id' changes (i.e., new alert), start the timer.
        // We also ensure it restarts if hover state changes
        if (!isHovered && !isDismissed) {
            startTimer();
        } else if (isHovered && timeoutRef.current) {
            // Pause timer on hover
            clearTimeout(timeoutRef.current);
        }

        // Cleanup on unmount or before running effect again
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isHovered, isDismissed, startTimer, id]); // Dependencies ensure logic re-runs on state/prop changes

    // FIX: Render component always, rely on CSS opacity/translate for visual state.
    // Since this component is only rendered if it's in the 'alerts' array, 
    // we don't need a local render check based on 'message'.
    // The conditional rendering is handled by the map in AlertContext.jsx
    
    // We reset the 'isDismissed' state when a new alert is received via the 'id' prop 
    // to ensure the fade animation runs correctly.
    useEffect(() => {
        setIsDismissed(false);
    }, [id]);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current); // Pause the timer
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        // Start the fade-out process if the mouse leaves, which will be caught by the main useEffect
        // We need to re-invoke the logic immediately when the mouse leaves
        if (!isDismissed) {
            startTimer();
        }
    };

    const dismissAlert = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Step 1: Start fade-out animation quickly
        setIsDismissed(true);
        // Step 2: Call onDismiss (remove from array) after quick animation
        setTimeout(onDismiss, 200); 
    };

    return (
        <div 
            // FIX: Removed unnecessary transformation classes and simplified transition 
            // to rely on opacity and height changes (implicitly handled by Tailwind space-y-2)
            className={`p-4 rounded-lg shadow-xl text-white font-medium max-w-lg w-full cursor-pointer 
                        ${bg} 
                        transition-opacity duration-500 ease-in-out
                        ${isDismissed ? 'opacity-0' : 'opacity-100'}`}
            role="alert"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={dismissAlert} // Alert disappears when clicked
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {icon}
                    <span>{message}</span>
                </div>
                {/* Cross button for dismissal */}
                <button
                    onClick={(e) => { e.stopPropagation(); dismissAlert(); }}
                    className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                    aria-label="Close alert"
                >
                    <FaTimes className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CustomAlert;