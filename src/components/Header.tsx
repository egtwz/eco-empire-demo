import { useState } from 'react';
import TonPlaceholder from './TonPlaceholder';
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
      <div className="w-full fixed top-0 z-20 bg-[var(--bg)] border-b-2 border-[var(--primary)] shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 p-3 flex-nowrap">
          <div className="flex items-center gap-2 flex-nowrap">
            <div className="text-lg font-bold text-[var(--primary)] whitespace-nowrap">🌿 EcoEmpire</div>
          </div>
          <div className="flex items-center gap-2 flex-nowrap">
            <TonPlaceholder balance={game.state.tonBalance} onClick={() => setShowTonInfo(true)} />
            <button 
              onClick={() => setShowBuyEco(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold text-sm shadow-md whitespace-nowrap cursor-pointer hover:opacity-90"
            >
              {balance} $ECO
            </button>
          </div>
        </div>
      </div>
      <BuyEcoModal open={showBuyEco} onClose={() => setShowBuyEco(false)} game={game} />
      <TonInfoModal open={showTonInfo} onClose={() => setShowTonInfo(false)} />
    </>
  );
}
