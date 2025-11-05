import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress();
  const walletAddress = userFriendlyAddress;
  const isConnected = !!walletAddress;

  const disconnectWallet = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return {
    walletAddress,
    isConnected,
    disconnectWallet,
  };
}

