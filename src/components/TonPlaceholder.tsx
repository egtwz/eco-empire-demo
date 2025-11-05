import { formatWithMUnits } from '../utils/numberFormat';

export default function TonPlaceholder({ balance, onClick }: { balance: number; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 whitespace-nowrap cursor-pointer"
    >
      {formatWithMUnits(balance)} TON
    </button>
  );
}





