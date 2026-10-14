import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { base, baseSepolia } from 'wagmi/chains';
import { Chain } from 'viem';

export type Environment = 'PRODUCTION' | 'SANDBOX';

interface EnvironmentContextType {
    environment: Environment;
    toggleEnvironment: () => void;
    targetChain: Chain;
    isMockMode: boolean;
    setMockMode: (val: boolean) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const environment: Environment = 'PRODUCTION';
    const toggleEnvironment = () => {};

    const [isMockMode, setIsMockMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('Zeinyra_mock_mode');
        // Default OFF — dashboard shows real connected-wallet numbers
        return saved ? saved === 'true' : false;
    });

    useEffect(() => {
        localStorage.setItem('Zeinyra_mock_mode', isMockMode.toString());
    }, [isMockMode]);

    const targetChain = environment === 'PRODUCTION' ? base : baseSepolia;

    return (
        <EnvironmentContext.Provider value={{ 
            environment, 
            toggleEnvironment, 
            targetChain, 
            isMockMode, 
            setMockMode: setIsMockMode 
        }}>
            <div
                className="min-h-screen text-white transition-colors duration-500"
                style={{
                    background: environment === 'SANDBOX'
                        ? 'linear-gradient(180deg, rgba(30,15,5,1) 0%, rgba(20,10,3,1) 50%, rgba(10,5,2,1) 100%)' // Dark Orange/Brown
                        : 'linear-gradient(180deg, #080C14 0%, #0A1020 50%, #050810 100%)' // Deep Blue
                }}
            >
                {children}
            </div>
        </EnvironmentContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEnvironment = (): EnvironmentContextType => {
    const context = useContext(EnvironmentContext);
    if (!context) {
        throw new Error('useEnvironment must be used within an EnvironmentProvider');
    }
    return context;
};
