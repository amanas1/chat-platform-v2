import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../../../types';
import { Sparkles, Radio, Users, Zap, User } from 'lucide-react';
import { playCardOpenSound } from '../utils/spatialSoundEngine';

interface DiscoveryViewProps {
  users: UserProfile[];
  onKnockUser: (userId: string) => void;
  onGoToRooms: () => void;
  language?: string;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ users, onKnockUser, onGoToRooms, language = 'en' }) => {
  const [showOnline, setShowOnline] = useState(false);

  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-y-auto no-scrollbar relative p-6 pb-20">
      
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tight display-font text-glow-subtle">Поиск собеседника</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
             </span>
             <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">В эфире: {124 + users.length * 3}</span>
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed max-w-[280px]">Выберите формат общения или найдите пользователя онлайн.</p>
        <div className="text-[10px] text-green-400 font-bold tracking-widest uppercase mt-1">Ищут диалог: {users.length}</div>
      </div>

      {/* Format Selection Cards (Two Premium Cards) */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        
        {/* Случайный диалог */}
        <motion.div 
          onClick={() => { playCardOpenSound(); console.log('Random Match Clicked'); }}
          className="glass-surface hover-stage-lift rounded-2xl p-4 flex items-center gap-5 cursor-pointer group relative overflow-hidden"
        >
          {/* Subtle Hover Spotlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -translate-x-full group-hover:translate-x-full" />
          
          <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 group-hover:scale-[1.08] transition-transform duration-300 shadow-[inset_0_2px_10px_rgba(249,115,22,0.2)]">
            <Zap className="w-6 h-6 text-orange-400 group-hover:text-orange-300" />
          </div>
          <div>
            <h3 className="text-white font-black text-[15px] mb-1 tracking-wide">Случайный диалог</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">Мгновенное подключение к свободному пользователю.</p>
          </div>
        </motion.div>

        {/* Показать онлайн */}
        <motion.div 
          onClick={() => { playCardOpenSound(); setShowOnline(!showOnline); }}
          className={`glass-surface hover-stage-lift rounded-2xl p-4 flex items-center gap-5 cursor-pointer group relative overflow-hidden transition-all duration-300 ${showOnline ? 'border-purple-500/50 bg-white/[0.06] shadow-[0_0_30px_rgba(168,85,247,0.15)]' : ''}`}
        >
           <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -translate-x-full group-hover:translate-x-full" />
          
          <div className={`w-14 h-14 rounded-[14px] bg-gradient-to-br from-purple-500/20 to-blue-500/10 border flex items-center justify-center shrink-0 transition-all duration-300 shadow-[inset_0_2px_10px_rgba(168,85,247,0.2)] ${showOnline ? 'border-purple-400/60 scale-[1.08]' : 'border-purple-500/30 group-hover:scale-[1.08]'}`}>
            <Users className={`w-6 h-6 ${showOnline ? 'text-purple-300' : 'text-purple-400 group-hover:text-purple-300'}`} />
          </div>
          <div>
            <h3 className="text-white font-black text-[15px] mb-1 tracking-wide">Показать онлайн</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">Список активных пользователей сети ({users.length}).</p>
          </div>
        </motion.div>
      </div>

      {/* User Grid */}
      <AnimatePresence>
        {showOnline && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
            className="flex flex-col gap-4 overflow-hidden"
          >
            {users.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  <p className="font-bold tracking-[0.2em] uppercase text-[10px] text-purple-400/50">Поиск сетей...</p>
                </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-8">
                {users.map((user, i) => (
                   <motion.div
                     key={user.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.4, delay: i * 0.06, ease: [0.25, 0.8, 0.25, 1] }}
                     className="glass-surface hover-stage-lift rounded-2xl flex flex-col items-center justify-center p-5 relative group cursor-default"
                   >
                     {/* Glow Ring Avatar */}
                     <div className="relative mb-4 mt-2">
                        {/* Soft Glow Underlay */}
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-cyan-400/30 transition-colors duration-500" />
                        
                        <div className="w-16 h-16 rounded-full bg-[#0B0F1C] border border-white/10 flex items-center justify-center relative shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] z-10 overflow-hidden group-hover:border-cyan-500/40 transition-colors duration-300">
                            {user.avatar && user.avatar.startsWith('http') ? (
                               <img src={user.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={user.name} />
                            ) : (
                               <span className="text-2xl opacity-80">{user.avatar || '💎'}</span>
                            )}
                        </div>
                        {/* Status indicator pulse */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0B0F1C] rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)] z-20 flex items-center justify-center">
                           <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        </div>
                     </div>
                     
                     {/* User Details */}
                     <h3 className="text-white font-black text-[13px] truncate w-full text-center tracking-wide mb-1">{user.name}</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                       {user.age ? `${user.age} ЛЕТ` : 'ВОЗРАСТ НЕ УКАЗАН'}
                     </p>
                     
                     <div className="bg-green-500/10 rounded-full px-3 py-1 mb-4 border border-green-500/20 inline-flex shadow-[inset_0_1px_4px_rgba(34,197,94,0.2)]">
                        <span className="text-[9px] text-green-400 uppercase tracking-widest font-black">Онлайн</span>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex w-full gap-2 mt-auto">
                        <button 
                          onClick={(e) => { e.stopPropagation(); playCardOpenSound(); onKnockUser(user.id); }}
                          className="flex-1 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] text-cyan-400 hover:bg-[rgba(34,211,238,0.1)] hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 text-[10px] font-black uppercase tracking-widest transition-all hover-stage-lift hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                        >
                          Начать
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); playCardOpenSound(); }}
                          className="px-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 flex items-center justify-center transition-all hover-stage-lift"
                        >
                          <User className="w-3.5 h-3.5" />
                        </button>
                     </div>
                   </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
