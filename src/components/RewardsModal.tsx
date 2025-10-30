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
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg"
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

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="font-semibold text-blue-800 mb-1">Подписки на каналы</div>
                <div className="text-xs text-blue-900 mb-2">Подпишитесь на каналы и получите награды</div>
                <ul className="text-xs text-blue-900 list-disc pl-5 space-y-1">
                  <li>Канал EcoEmpire Новости — +100 $ECO</li>
                  <li>Канал Партнёров — +1 ускоритель ⚡</li>
                </ul>
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
  const dailyStreak = game?.state?.dailyStreak ?? 0;
  const todayIndex = Math.min(dailyStreak, 14);
  const canClaim = game?.canClaimDaily ? game.canClaimDaily() : false;
  const handleClaim = () => {
    if (!game?.claimDaily) return;
    const reward = plan[todayIndex];
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
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold">Ежедневные награды</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div className="text-xs text-gray-600 mb-3">Заходите каждый день и забирайте призы. День {todayIndex + 1} из 15</div>

            <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-1 mb-3">
              {plan.map((r, idx) => (
                <div key={idx} className={`p-3 rounded-xl border text-center ${idx === todayIndex ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-xs text-gray-500 mb-1">День {idx + 1}</div>
                  <div className="text-lg mb-1">{r.emoji}</div>
                  <div className="text-[11px] text-gray-700 whitespace-pre-line">{r.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-auto -mx-5 -mb-5 px-5 pb-5 pt-3 bg-white">
              <button disabled={!canClaim} onClick={handleClaim} className={`w-full py-3 rounded-xl font-semibold text-white ${canClaim ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}>
                Забрать награду
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


