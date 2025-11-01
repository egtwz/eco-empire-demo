interface Props {
  view: 'field' | 'shop' | 'inventory' | 'exchange' | 'profile';
  setView: (v: Props['view']) => void;
}

export default function Navigation({ view, setView }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[var(--primary)] shadow-lg z-20">
      <div className="max-w-md mx-auto px-2 py-3">
        <div className="flex items-center justify-around gap-2">
          {/* Левая сторона */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('inventory')}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                view === 'inventory' 
                  ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white shadow-md scale-105' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={{ minWidth: '65px', minHeight: '70px' }}
            >
              <span className="text-2xl mb-1">🎒</span>
              <span className="text-xs font-medium">Инвентарь</span>
            </button>
            
            <button
              onClick={() => setView('exchange')}
              className="flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all bg-gray-100 opacity-60 cursor-not-allowed"
              style={{ minWidth: '65px', minHeight: '70px' }}
              disabled
            >
              <span className="text-2xl mb-1">🔨</span>
              <span className="text-xs font-medium">В разработке</span>
            </button>
          </div>

          {/* Центр - круглая кнопка Поле */}
          <button
            onClick={() => setView('field')}
            className={`flex items-center justify-center rounded-full transition-all shadow-lg ${
              view === 'field' 
                ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white scale-110' 
                : 'bg-gradient-to-br from-[var(--secondary)] to-[var(--accent)] text-[var(--text)] hover:scale-105'
            }`}
            style={{ width: '72px', height: '72px' }}
          >
            <div className="text-center">
              <div className="text-2xl mb-0.5">🌱</div>
              <div className="text-[10px] font-bold leading-none">Поле</div>
            </div>
          </button>

          {/* Правая сторона */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('shop')}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                view === 'shop' 
                  ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white shadow-md scale-105' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={{ minWidth: '58px', minHeight: '64px' }}
            >
              <span className="text-xl mb-0.5">🛒</span>
              <span className="text-[10px] font-medium leading-none">Магазин</span>
            </button>
            
            <button
              onClick={() => setView('profile')}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                view === 'profile' 
                  ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white shadow-md scale-105' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={{ minWidth: '58px', minHeight: '64px' }}
            >
              <span className="text-xl mb-0.5">👤</span>
              <span className="text-[10px] font-medium leading-none">Профиль</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

