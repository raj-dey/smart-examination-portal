import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { appId, auth, db } from './firebase';
import SuperAdminDashboard from './views/SuperAdminDashboard';

import LandingPage from './views/LandingPage';
import QuizInterface from './views/QuizInterface';
import StudentDashboard from './views/StudentDashboard';
import TeacherDashboard from './views/TeacherDashboard';

export default function App() {
  const [_user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('loading');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fireUser) => {
      if (!fireUser) {
        setView('landing');
        setUser(null);
        setProfile(null);
      } else {
        setUser(fireUser);
        const pRef = doc(db, 'artifacts', appId, 'users', fireUser.uid);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists()) {
          const data = pSnap.data();
          setProfile(data);
          // Update this logic to include the 'admin' check
          if (data.role?.toLowerCase() === 'admin') {
            setView('admin');

          } else {
            setView(data.role === 'teacher' ? 'teacher' : 'student');
          }
        } else {
          // If no profile exists, the LandingPage will handle creation via Registration
          setView('landing');
        }
      }
    });
    return () => unsub();
  }, []);

  if (view === 'loading')
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center font-sans">
        {/* Container with fade-in and zoom animation */}
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">

          {/* The Blue Graduation Cap Logo */}
          <div className="w-20 h-20 bg-[#544bfa] text-white rounded-[24px] flex items-center justify-center shadow-[0_20px_40px_-15px_rgba(84,75,250,0.4)] mb-6 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>

          {/* Initializing Text */}
          <h3 className="text-[#1e2432] text-xl font-black tracking-tight mb-2">
            Initializing...
          </h3>

          {/* Developer Credit */}
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">
            Developed By <span className="text-[#544bfa]">RAJ DEY</span>
          </p>

          {/* Three-dot jumping loader */}
          <div className="mt-8 flex gap-1">
            <div className="w-1.5 h-1.5 bg-[#544bfa] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-[#544bfa] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-[#544bfa] rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );


  if (view === 'landing') return <LandingPage />;

  if (view === 'admin') {
    return <SuperAdminDashboard profile={profile} />;
  }

  if (view === 'student') {
    if (activeQuiz) return <QuizInterface quiz={activeQuiz} studentData={studentData} onComplete={() => setActiveQuiz(null)} />;

    return <StudentDashboard profile={profile} onStartQuiz={(q, data) => { setActiveQuiz(q); setStudentData(data); }} />;
  }

  if (view === 'teacher') return <TeacherDashboard profile={profile} />;

  return null;
}