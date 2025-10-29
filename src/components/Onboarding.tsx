import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Story {
  id: number;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

const STORIES: Story[] = [
  {
    id: 1,
    emoji: '🌍',
    title: 'Добро пожаловать в EcoEmpire',
    description: 'Стань хозяином своей экологической империи! Выращивай растения, собирай урожай и зарабатывай.',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 2,
    emoji: '🌱',
    title: 'Выращивай растения',
    description: 'Покупай семена, сажай их на поле и жди созревания. Каждое растение уникально!',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 3,
    emoji: '💰',
    title: 'Продавай урожай',
    description: 'Собирай плоды и продавай их за $ECO. Чем выше редкость, тем больше прибыль!',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 4,
    emoji: '🔬',
    title: 'Создавай гибриды',
    description: 'Смешивай растения и получай уникальные гибриды с повышенной ценностью!',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 5,
    emoji: '🎮',
    title: 'Развивайся',
    description: 'Получай опыт, повышай уровень и открывай новые возможности для своей империи!',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 6,
    emoji: '👥',
    title: 'Играй с друзьями',
    description: 'Приглашай друзей и получай бонусы за их активность. Вместе веселее!',
    color: 'from-red-500 to-rose-600'
  }
];

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [currentStory, setCurrentStory] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleClick = () => {
    if (currentStory < STORIES.length - 1) {
      setCurrentStory(prev => prev + 1);
    } else if (!showWelcome) {
      setShowWelcome(true);
    }
  };

  const handleStart = () => {
    onComplete();
  };

  // Экран приветствия
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-8xl mb-8"
          >
            🎉
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl font-bold text-white mb-4"
          >
            Добро пожаловать!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl text-white/70 mb-8"
          >
            Теперь ты часть EcoEmpire
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onClick={handleStart}
            className="px-8 py-4 text-xl rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-2xl transition-all active:scale-95"
          >
            Начать играть
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Истории
  const current = STORIES[currentStory];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black cursor-pointer"
      onClick={handleClick}
    >
      {/* Индикаторы прогресса */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {STORIES.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentStory
                ? 'w-12 bg-white'
                : index < currentStory
                ? 'w-12 bg-white/50'
                : 'w-12 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Контент истории */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center h-full p-8"
        >
          <motion.div
            className={`w-full max-w-md rounded-3xl bg-gradient-to-br ${current.color} p-8 flex flex-col items-center justify-center shadow-2xl mb-4`}
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          >
            <div className="text-8xl mb-6">{current.emoji}</div>
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              {current.title}
            </h2>
            <p className="text-lg text-white/90 text-center">
              {current.description}
            </p>
          </motion.div>

          {/* Подсказка */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm animate-pulse">
            Нажмите для продолжения
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
