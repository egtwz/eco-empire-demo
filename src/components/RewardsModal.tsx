import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';

export default function RewardsModal({ open, onClose, game }: { open: boolean; onClose: () => void; game: ReturnType<typeof useGameLogic> }) {
  const [openDaily, setOpenDaily] = useState(false);
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">🎁 Награды</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div className="space-y-3">
              <button onClick={() => setOpenDaily(true)} className="w-full p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-left hover:bg-yellow-100 transition-colors">
                <div className="font-semibold text-yellow-800 mb-1">Ежедневные награды</div>
                <div className="text-xs text-yellow-900">15-дневная серия посещений с призами</div>
              </button>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed">
                <div className="font-semibold text-gray-600 mb-1">Скоро здесь появятся награды...</div>
                <div className="text-xs text-gray-500">Новые награды будут доступны в ближайшее время</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {openDaily && (
        <DailyRewardsModal
          open={openDaily}
          onClose={() => setOpenDaily(false)}
          game={game}
          onClaimed={() => { setOpenDaily(false); onClose(); (game as any)?.setView && (game as any).setView('field'); }}
        />
      )}
    </AnimatePresence>
  );
}

function DailyRewardsModal({ open, onClose, game, onClaimed }: { open: boolean; onClose: () => void; game: ReturnType<typeof useGameLogic>; onClaimed: () => void }) {
  const plan = buildDailyPlan();
  const cycleLength = plan.length;
  const lastClaimedDay = game?.state?.dailyCycleDay ?? 0;
  const canClaim = game?.canClaimDaily ? game.canClaimDaily() : false;
  const nextDay = ((lastClaimedDay % cycleLength) + 1);
  const displayDay = canClaim ? nextDay : (lastClaimedDay === 0 ? 1 : lastClaimedDay);
  const highlightIndex = Math.max(0, (canClaim ? nextDay - 1 : displayDay - 1));

  const handleClaim = () => {
    if (!game?.claimDaily) return;
    const reward = plan[Math.min(nextDay - 1, cycleLength - 1)];
    game.claimDaily(rewardToPlanArg(reward));
    onClaimed();
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl max-h-[66vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold">Ежедневные награды</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div className="text-xs text-gray-600 mb-3">День {displayDay} из {cycleLength}. Собирайте награды подряд, чтобы завершить 15-дневный цикл.</div>

            <div className="grid grid-cols-3 gap-2 pr-1 mb-3 flex-1 overflow-y-auto min-h-0">
              {plan.map((r, idx) => (
                <div key={idx} className={`p-3 rounded-xl border text-center ${idx === highlightIndex ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-xs text-gray-500 mb-1">День {idx + 1}</div>
                  <div className="text-lg mb-1">{r.emoji}</div>
                  <div className="text-[11px] text-gray-700 whitespace-pre-line">{r.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-auto -mx-5 -mb-5 px-5 pb-5 pt-3 bg-white">
              <button disabled={!canClaim} onClick={handleClaim} className={`w-full py-3 rounded-xl font-semibold text-white ${canClaim ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}>
                {canClaim ? 'Забрать награду' : 'Уже собрано, возвращайтесь завтра'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function buildDailyPlan(): Array<{ label: string; emoji: string; eco?: number; boosters?: number; seedRarity?: 'common'|'uncommon'|'rare'|'epic'|'legendary' }>{
  return [
    { label: '+50 $ECO', emoji: '💵', eco: 50 },
    { label: 'Ускоритель ⚡', emoji: '⚡', boosters: 1 },
    { label: 'Обычные семена 🌱', emoji: '🌱', seedRarity: 'common' },
    { label: '+75 $ECO', emoji: '💵', eco: 75 },
    { label: 'Ускоритель ⚡', emoji: '⚡', boosters: 1 },
    { label: 'Обычные семена 🌱', emoji: '🌱', seedRarity: 'common' },
    { label: '+100 $ECO', emoji: '💵', eco: 100 },
    { label: 'Необычные семена 🌿', emoji: '🌿', seedRarity: 'uncommon' },
    { label: 'Ускоритель ⚡', emoji: '⚡', boosters: 2 },
    { label: '+150 $ECO', emoji: '💵', eco: 150 },
    { label: 'Редкие семена 🌳', emoji: '🌳', seedRarity: 'rare' },
    { label: '+200 $ECO', emoji: '💵', eco: 200 },
    { label: 'Ускоритель ⚡', emoji: '⚡', boosters: 3 },
    { label: 'Эпические семена 💎', emoji: '💎', seedRarity: 'epic' },
    { label: '+300 $ECO', emoji: '💵', eco: 300 },
  ];
}

function rewardToPlanArg(r: { eco?: number; boosters?: number; seedRarity?: 'common'|'uncommon'|'rare'|'epic'|'legendary' }) {
  return { eco: r.eco, boosters: r.boosters, seedRarity: r.seedRarity };
}


