import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';

interface ReferralSummary {
  telegramId: number;
  username?: string;
  playerId?: string;
  title?: string;
  level?: number;
  balance?: number;
  totalEarned?: number;
  seedsPlanted?: number;
  fruitsHarvested?: number;
  hybridsCreated?: number;
  dailyStreak?: number;
  dailyCycleDay?: number;
}

interface ReferralsModalProps {
  open: boolean;
  onClose: () => void;
  game: ReturnType<typeof useGameLogic>;
}

export default function ReferralsModal({ open, onClose, game }: ReferralsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralSummary[]>([]);
  const [selected, setSelected] = useState<ReferralSummary | null>(null);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await game.getReferrals();
        if (!cancelled) {
          setReferrals(list);
          setSelected(list[0] ?? null);
          game.setReferralCount(list.length);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Не удалось получить список приглашённых. Попробуйте позже.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, game.getReferrals, game.setReferralCount]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-3xl bg-white rounded-2xl p-5 shadow-lg grid gap-4 md:grid-cols-[2fr,3fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 md:mb-0">
              <div>
                <div className="text-lg font-bold">Приглашённые друзья</div>
                {game.state.referralStats && (
                  <div className="text-xs text-gray-500 mt-1">
                    Общий доход: {game.state.referralStats.totalIncome.toLocaleString()} $ECO ·
                    Продажи: {game.state.referralStats.salesIncome.toLocaleString()} $ECO ·
                    Пополнения: {game.state.referralStats.tonIncome.toLocaleString()} $ECO
                  </div>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div className="md:col-span-1 max-h-[60vh] overflow-y-auto pr-2 border-r border-gray-100">
              {loading && <div className="text-sm text-gray-500">Загрузка...</div>}
              {error && <div className="text-sm text-red-500">{error}</div>}
              {!loading && !error && referrals.length === 0 && (
                <div className="text-sm text-gray-500">Вы ещё не пригласили друзей.</div>
              )}
              <div className="space-y-2">
                {referrals.map((ref) => (
                  <button
                    key={ref.telegramId}
                    onClick={() => setSelected(ref)}
                    className={`w-full text-left p-3 rounded-xl border transition ${selected?.telegramId === ref.telegramId ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="font-semibold text-gray-800">{ref.username || 'Без имени'}</div>
                    <div className="text-xs text-gray-500">TG: {ref.telegramId}</div>
                    <div className="text-xs text-gray-500">ID игрока: {ref.playerId ?? '—'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-1">
              {selected ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                    <div className="text-lg font-semibold text-purple-800">{selected.username || 'Без имени'}</div>
                    <div className="text-sm text-purple-700">Telegram ID: {selected.telegramId}</div>
                    <div className="text-sm text-purple-700">ID игрока: {selected.playerId ?? '—'}</div>
                    <div className="text-sm text-purple-700">Титул: {selected.title || '—'}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Уровень</div>
                      <div className="text-lg font-semibold text-gray-800">{selected.level ?? '—'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Баланс</div>
                      <div className="text-lg font-semibold text-gray-800">{selected.balance?.toLocaleString?.() ?? '—'} $ECO</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Всего заработано</div>
                      <div className="text-lg font-semibold text-gray-800">{selected.totalEarned?.toLocaleString?.() ?? '—'} $ECO</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Семян посажено</div>
                      <div className="text-lg font-semibold text-gray-800">{selected.seedsPlanted ?? '—'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Плодов собрано</div>
                      <div className="text-lg font-semibold text-gray-800">{selected.fruitsHarvested ?? '—'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Гибридов создано</div>
                      <div className="text-lg font-semibold text-gray-800">{selected.hybridsCreated ?? '—'}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-600">
                    Текущий прогресс наград: день {selected.dailyCycleDay ?? 0}, серия {selected.dailyStreak ?? 0}.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Выберите игрока слева, чтобы посмотреть профиль.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
