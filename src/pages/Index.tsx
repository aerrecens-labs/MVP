
import React from 'react';
import AppLayout from '@/components/AppLayout';
import ProvisioningModal from '@/components/dashboard/ProvisioningModal';
import { AppProvider } from '@/contexts/AppContext';
import { WalletProvider } from '@/contexts/WalletContext';

const Index: React.FC = () => {
  return (
    <WalletProvider>
      <AppProvider>
        <AppLayout />
        <ProvisioningModal />
      </AppProvider>
    </WalletProvider>
  );
};

export default Index;
