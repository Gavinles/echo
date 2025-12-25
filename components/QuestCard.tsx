
import React from 'react';
import { Quest } from '../types';

interface QuestCardProps {
  quest: Quest;
  isCompleted: boolean;
  onSelect: (quest: Quest) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, isCompleted, onSelect }) => {
  return (
    <div 
      onClick={() => !isCompleted && onSelect(quest)}
      className={`p-4 rounded-2xl glass transition-all cursor-pointer group ${
        isCompleted ? 'opacity-50 grayscale' : 'hover:scale-105 hover:bg-white/5'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{quest.icon}</span>
        <div className="flex flex-col items-end">
          <span className="text-xs font-space text-cyan-400 uppercase tracking-widest">{quest.category}</span>
          <span className="text-sm font-bold text-white/90">+{quest.rewardSU} SU</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{quest.title}</h3>
      <p className="text-xs text-white/60 line-clamp-2">{quest.prompt}</p>
      
      {isCompleted && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase tracking-tighter">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Integrated
        </div>
      )}
    </div>
  );
};
