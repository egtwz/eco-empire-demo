import { useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';

export default function Exchange({ game }: { game: ReturnType<typeof useGameLogic> }) {
  const { state } = game;
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  return (
    <div className="max-w-md mx-auto p-3 pb-24">
      <div className="text-xl font-bold mb-4 text-center">📈 Биржа</div>
      
      {/* Вкладки */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
            activeTab === 'buy' 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-700 shadow-md' 
              : 'bg-gray-100 text-gray-600 border-gray-400 hover:bg-gray-200'
          }`}
        >
          <div className="text-lg mb-1">🛒</div>
          <div className="text-xs">Купить</div>
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
            activeTab === 'sell' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-700 shadow-md' 
              : 'bg-gray-100 text-gray-600 border-gray-400 hover:bg-gray-200'
          }`}
        >
          <div className="text-lg mb-1">💰</div>
          <div className="text-xs">Продать</div>
        </button>
      </div>

      {/* Контент */}
      {activeTab === 'buy' && (
        <div className="space-y-3">
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-sm">Покупка на бирже</div>
            <div className="text-xs mt-1">В разработке</div>
          </div>
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="space-y-3">
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-sm">Продажа на бирже</div>
            <div className="text-xs mt-1">В разработке</div>
          </div>
        </div>
      )}

      {/* Информация о бирже */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
        <div className="text-sm font-semibold text-purple-800 mb-2">ℹ️ О бирже</div>
        <div className="text-xs text-purple-700 space-y-1">
          <div>• Торгуйте семенами и плодами с другими игроками</div>
          <div>• Устанавливайте свои цены</div>
          <div>• Получайте уведомления о выгодных предложениях</div>
          <div>• Приоритет для подписчиков Plus/Premium</div>
        </div>
      </div>
    </div>
  );
}

