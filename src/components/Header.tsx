import { useState } from 'react';
import TonPlaceholder from './TonPlaceholder';
import { formatWithMUnits } from '../utils/numberFormat';
import { useGameLogic } from '../hooks/useGameLogic';
import BuyEcoModal from './BuyEcoModal';
import TonInfoModal from './TonInfoModal';

interface Props {
  balance: number;
  view: 'field' | 'shop' | 'inventory' | 'exchange' | 'profile';
  setView: (v: Props['view']) => void;
  game: ReturnType<typeof useGameLogic>;
}

export default function Header({ balance, game }: Props) {
  const [showBuyEco, setShowBuyEco] = useState(false);
  const [showTonInfo, setShowTonInfo] = useState(false);
  
  return (
    <>
      <div className="w-full fixed top-0 z-20 left-0 right-0">
        {/* Safe-area сверху: заполняем белым, чтобы не было "дырки" при скролле */}
        <div className="w-full bg-white" style={{ height: 'env(safe-area-inset-top)', minHeight: 'env(safe-area-inset-top)' }} />
        {/* Сам бар */}
        <div className="w-full bg-white border-b-2 border-[var(--primary)] shadow-md">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2 p-3 pb-3 flex-nowrap">
            <TonPlaceholder balance={game.state.tonBalance} onClick={() => setShowTonInfo(true)} />
            <button 
              onClick={() => setShowBuyEco(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold text-sm shadow-md whitespace-nowrap cursor-pointer hover:opacity-90"
            >
              {formatWithMUnits(balance)} 🌿
            </button>
          </div>
        </div>
      </div>
      <BuyEcoModal open={showBuyEco} onClose={() => setShowBuyEco(false)} game={game} />
      <TonInfoModal open={showTonInfo} onClose={() => setShowTonInfo(false)} />
    </>
  );
}
