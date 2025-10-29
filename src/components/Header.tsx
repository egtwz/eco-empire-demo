import { colors } from '../data/colors';
import TonPlaceholder from './TonPlaceholder';
import { useGameLogic } from '../hooks/useGameLogic';
import { gameAPI } from '../api/gameApi';

interface Props {
  balance: number;
  view: 'field' | 'shop' | 'inventory' | 'exchange' | 'profile';
  setView: (v: Props['view']) => void;
  game: ReturnType<typeof useGameLogic>;
}

export default function Header({ balance, view, setView, game }: Props) {

  return (
    <>
      <div className="w-full fixed top-0 z-20 bg-[var(--bg)] border-b-2 border-[var(--primary)] shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 p-3 flex-nowrap">
          <div className="flex items-center gap-2 flex-nowrap">
            <div className="text-lg font-bold text-[var(--primary)] whitespace-nowrap">🌿 EcoEmpire</div>
          </div>
          <div className="flex items-center gap-2 flex-nowrap">
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold text-sm shadow-md whitespace-nowrap">
              {balance} $ECO
            </div>
            <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${gameAPI.isSaving() ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              {gameAPI.isSaving() ? 'Синхр...' : 'Синхр ок'}
            </div>
            <TonPlaceholder />
          </div>
        </div>
      </div>
    </>
  );
}
