import { signOut } from 'firebase/auth';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { auth } from '../firebase';

export default function Navbar({ profile }) {
  return (
    <nav className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-xl text-white">
          <GraduationCap size={24} />
        </div>
        <span className="text-xl font-black tracking-tighter">
          Quiz<span className="text-indigo-600">Pro</span>
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 border-r border-slate-100 pr-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-800 leading-none">{profile?.name || 'User'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
              {profile?.role || 'Guest'}
            </p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <User size={20} />
          </div>
        </div>
        
        <button 
          onClick={() => signOut(auth)}
          className="text-slate-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}