import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../../../types';
import { TRANSLATIONS } from '../../../types/constants';
import { Sparkles, Radio } from 'lucide-react';

interface DiscoveryViewProps {
  users: UserProfile[];
  onKnockUser: (userId: string) => void;
  onGoToRooms: () => void;
  language?: string;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ users, onKnockUser, onGoToRooms, language = 'en' }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-y-auto no-scrollbar relative">
      
      {/* Discovery Header */}
      <div className="sticky top-0 z-20 px-6 py-5 border-b border-white/5 bg-[#0B0F1C]/60 backdrop-blur-md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              {t.globalRadar || 'Global Radar'}
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
               <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">{users.length} {t.online || 'Online'}</span>
            </div>
          </div>
          
          <button 
            onClick={onGoToRooms}
            className="group relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 px-4 py-3.5 border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_30px_rgba(249,115,22,0.25)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Radio className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
            <span className="text-xs font-black tracking-[0.2em] uppercase text-orange-400 group-hover:text-orange-300 transition-colors relative z-10">
              {t.accessPublicRooms || 'Access Public Rooms'}
            </span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {users.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
             <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
             <p className="font-bold tracking-[0.2em] uppercase text-[10px] text-purple-400/50">{t.scanningSignals || 'Scanning Signals...'}</p>
          </div>
        ) : (
          users.map((user, i) => (
             <motion.div
               key={user.id}
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               transition={{ duration: 0.4, delay: i * 0.05, ease: [0.25, 0.8, 0.25, 1] }}
               className="group relative rounded-[20px] overflow-hidden bg-white/[0.02] border border-white/[0.04] hover:border-cyan-400/50 hover:bg-white/[0.06] hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] transition-all duration-300 cursor-pointer backdrop-blur-[12px]"
               onClick={() => onKnockUser(user.id)}
             >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <div className="p-5 flex flex-col items-center gap-3 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-[#0B0F1C] border border-white/5 flex items-center justify-center relative shadow-inner group-hover:border-cyan-400/30 transition-colors">
                        <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">{user.avatar || '👽'}</span>
                        <div className="absolute bottom-[2px] right-[2px] w-3 h-3 bg-green-500 border-2 border-[#0B0F1C] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>
                    <div className="text-center w-full">
                        <h3 className="text-white/90 font-black text-xs tracking-wider group-hover:text-cyan-300 transition-colors truncate">{user.name}</h3>
                        <p className="text-slate-500 font-bold tracking-widest text-[9px] mt-1.5 uppercase truncate">
                          {user.age ? `${user.age}Y` : (t.unknown || 'UNK')} • {user.gender ? user.gender.substring(0,1) : '?'}
                        </p>
                    </div>
                </div>
             </motion.div>
          ))
        )}
      </div>

    </div>
  );
};
