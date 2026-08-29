import { collection, getDocs, query, where } from 'firebase/firestore';
import { BookOpen, Check, ChevronDown, ChevronRight, ClipboardCheck, Key, Loader2, Search, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from '../utils/toast';
import Layout from '../components/Layout';
import { appId, auth, db } from '../firebase';
import AIQuizView from './AIQuizView';

// Data Mapping
const FACULTIES = ["Nursing", "Science", "Engineering", "Computer Technology", "Paramedical Sciences", "Pharmaceutical Science", "Commerce and Management", "Humanities and Social Sciences", "Physiotherapy and Rehabilitation", "Agricultural Sciences and Technology"];
const FACULTY_DATA = {
  "Nursing": ["B.Sc Nursing", "Post Basic Nursing", "M.Sc Nursing (Child Health Nursing)", "M.Sc Nursing (Community Health Nursing)", "M.Sc Nursing (Medical Surgical Nursing)", "M.Sc Nursing (Obstetrics & Gynaecological Nursing)"],
  "Science": ["B.Sc Biotechnology", "B.Sc Food Nutrition and Dietetics", "B.Sc Microbiology", "B.Sc Forensic Science", "M.Sc Botany", "M.Sc Food Nutrition and Dietetics", "M.Sc Microbiology", "M.Sc Zoology", "M.Sc Chemistry", "M.Sc Forensic Science", "M.Sc Mathematics", "M.Sc Physics", "M.Sc Biotechnology"],
  "Engineering": ["B.Tech Civil Engineering", "B.Tech Mechanical Engineering", "B.Tech Civil Engineering (Construction Management)", "B.Tech Mechanical Engineering (Mechatronics)", "B.Tech Design"],
  "Computer Technology": ["B.Tech Computer Science and Engineering", "B.Tech Computer Science and Engineering & Business Systems", "B.Tech Data Science and Artificial Intelligence", "B.Tech Semiconductor Technology", "BCA (Computer Application)", "BCA System Application and Production", "B.Tech Artificial Intelligence and Deep Learning", "M.Tech / M.Sc Artificial Intelligence and Deep Learning"],
  "Paramedical Sciences": ["B.Sc Optometry", "B.Sc Critical Care Technology", "B.Sc Dialysis Technology", "B.Sc Medical Laboratory Technology", "B.Sc Operation Theatre Technology", "B.Sc Radiography and Advanced Imaging Technology", "B.Sc Trauma, Emergency & Disaster Management", "M.Sc Medical Laboratory Technology", "M.Sc Radiography & Imaging Technology"],
  "Pharmaceutical Science": ["B.Pharm", "D.Pharm", "M.Pharm (Pharmaceutics)", "M.Pharm (Pharmacology)"],
  "Commerce and Management": ["BBA (Business Administration)", "BBA Industry Integrated", "BBA Business Analytics", "BBA Supply Chain Management", "BBA Travel & Tourism Management", "BHM (Hotel Management & Catering Technology)", "B.Com", "MBA (General)", "MBA Corporate Finance", "MBA Industry Integrated", "MBA Healthcare Management", "MBA Travel & Tourism Management", "MCA / System Application and Production"],
  "Humanities and Social Sciences": ["BA (Arts Honours)", "BA English", "BA Psychology", "BA Clinical Psychology", "BA Sociology", "BA Social Work", "BA Administrative Services", "BA Performing Arts", "MA Applied Psychology", "MA Clinical Psychology", "MA Sociology", "MA Social Work", "MA English", "MA Administrative Services"],
  "Physiotherapy and Rehabilitation": ["Bachelor of Physiotherapy (BPT)", "Bachelor of Physical Education & Sports", "Master of Physiotherapy (MPT)"],
  "Agricultural Sciences and Technology": ["B.Sc Agriculture", "B.Sc Horticulture", "M.Sc Agriculture", "M.Sc Horticulture"]
};

// --- Custom Searchable Select Component ---
function SearchableSelect({ label, options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex-1 w-full relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-5 bg-[#f8fafc] rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${isOpen ? 'border-[#544bfa] bg-white shadow-md' : 'border-transparent'}`}
      >
        <span className={`font-bold truncate ${value ? 'text-[#1e2432]' : 'text-slate-400'}`}>
          {value || label}
        </span>
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-50 flex items-center gap-2 bg-slate-50">
            <Search size={16} className="text-slate-400" />
            <input
              autoFocus
              className="w-full bg-transparent outline-none font-bold text-sm text-[#1e2432]"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {filtered.length > 0 ? filtered.map(opt => (
              <div
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                className={`p-3 rounded-xl font-bold text-sm cursor-pointer transition-colors flex justify-between items-center ${value === opt ? 'bg-[#f0f0fe] text-[#544bfa]' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                {opt}
                {value === opt && <Check size={16} />}
              </div>
            )) : (
              <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard({ onStartQuiz, profile }) {
  const [filters, setFilters] = useState({ department: '', semester: '1', section: 'A' });
  const [quizzes, setQuizzes] = useState([]);
  const [step, setStep] = useState('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [verifyData, setVerifyData] = useState({ name: '', id: '' });
  const [pinInput, setPinInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // --- REAL DATA STATES ---
  const [stats, setStats] = useState({
    totalTaken: 0,
    avgScore: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    const fetchStudentStats = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, 'artifacts', appId, 'public', 'data', 'submissions'),
          where('studentUid', '==', auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => d.data());

        if (data.length > 0) {
          // Calculate Total and Average
          const total = data.length;
          const sumPercentages = data.reduce((acc, curr) => {
            const score = curr.score || 0;
            const totalQ = curr.total || 1;
            return acc + (score / totalQ) * 100;
          }, 0);

          // Calculate stats for "This Week"
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const thisWeekCount = data.filter(d => new Date(d.timestamp) > oneWeekAgo).length;

          setStats(prev => ({
            ...prev,
            totalTaken: total,
            avgScore: Math.round(sumPercentages / total),
            thisWeek: thisWeekCount
          }));
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        toast.error("Unable to load academic performance statistics.");
      }
    };

    fetchStudentStats();
  }, []);

  const searchQuizzes = async () => {
    if (!filters.faculty || !filters.department) return toast.error("Please select Faculty and Department.");
    setIsSearching(true);
    const toastId = toast.loading('Searching...');
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), where('faculty', '==', filters.faculty), where('department', '==', filters.department), where('semester', '==', filters.semester), where('section', '==', filters.section));
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuizzes(results);
      results.length > 0 ? toast.success(`Found ${results.length} assessment(s)!`, { id: toastId }) : toast.error('No assessments found.', { id: toastId });
    } catch (error) {
      toast.error(error, { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  // Verification and PIN steps remain identical to previous implementation
  if (step === 'verify') return (
    <Layout profile={profile}>
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-white p-12 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#544bfa] to-[#817afc]"></div>
          <div className="w-20 h-20 bg-[#f0f0fe] text-[#544bfa] rounded-[24px] flex items-center justify-center mx-auto mb-6"><ClipboardCheck size={40} strokeWidth={2.5} /></div>
          <h2 className="text-3xl font-black mb-3 text-[#1e2432]">Academic Verification</h2>
          <p className="text-slate-500 mb-10 font-medium">Please verify your identity before accessing <strong className="text-slate-700">{selectedQuiz.title}</strong>.</p>
          <div className="space-y-4">
            <input className="w-full p-4 bg-[#f8fafc] rounded-2xl outline-none border-2 border-transparent focus:border-[#544bfa] font-bold text-slate-800 transition-colors placeholder-slate-400" placeholder="Full Legal Name" onChange={e => setVerifyData({ ...verifyData, name: e.target.value })} />
            <input className="w-full p-4 bg-[#f8fafc] rounded-2xl outline-none border-2 border-transparent focus:border-[#544bfa] font-bold text-slate-800 transition-colors placeholder-slate-400" placeholder="University Enrollment ID" onChange={e => setVerifyData({ ...verifyData, id: e.target.value })} />
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('dashboard')} className="px-6 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
              <button onClick={() => { if (!verifyData.name || !verifyData.id) return toast.error("Please fill in all fields."); setStep('pin'); }} className="flex-1 bg-[#544bfa] text-white py-4 rounded-2xl font-black shadow-[0_10px_20px_-5px_rgba(84,75,250,0.4)] hover:-translate-y-1 transition-all">Proceed to PIN</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );

  if (step === 'pin') return (
    <Layout profile={profile}>
      <div className="max-w-md mx-auto py-16">
        <div className="bg-[#1e2432] p-12 rounded-[40px] shadow-2xl text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-yellow-500/20 text-yellow-400 rounded-[24px] flex items-center justify-center mx-auto mb-6"><Key size={40} strokeWidth={2.5} /></div>
          <h2 className="text-3xl font-black mb-3 text-white">Secure Assessment</h2>
          <p className="text-slate-400 mb-10 font-medium">Enter the 6-digit PIN provided by your invigilator.</p>
          <input className="w-full text-center text-4xl font-black tracking-[0.5em] p-6 bg-slate-800/50 border border-slate-700 text-white rounded-3xl outline-none focus:border-[#544bfa] focus:bg-slate-800 transition-all mb-8" maxLength={6} placeholder="******" onChange={e => setPinInput(e.target.value)} />
          <div className="flex flex-col gap-4">
            <button disabled={isUnlocking} onClick={() => { setIsUnlocking(true); if (pinInput === selectedQuiz.pin) { toast.success("Exam Unlocked! Good luck."); onStartQuiz(selectedQuiz, verifyData); } else { toast.error("Incorrect PIN. Please enter the correct 6-digit access code provided by your invigilator."); setIsUnlocking(false); } }} className="w-full bg-[#544bfa] text-white py-5 rounded-2xl font-black hover:bg-[#4338ca] transition-all flex items-center justify-center gap-2">
              {isUnlocking ? <Loader2 className="animate-spin" size={22} /> : 'Unlock Assessment'}
            </button>
            <button onClick={() => setStep('verify')} className="text-sm font-bold text-slate-500 hover:text-white transition-colors">Go Back</button>
          </div>
        </div>
      </div>
    </Layout>
  );

  const level = stats.avgScore > 90 ? 'Expert' : stats.avgScore > 50 ? 'Intermediate' : 'Beginner';

  if (showAI) return <AIQuizView onStart={onStartQuiz} onBack={() => setShowAI(false)} />;

  return (
    <Layout profile={profile}>
      <div className="max-w-7xl mx-auto py-10">
        {/* 1. BRANDED HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h1 className="text-[2.5rem] font-black text-[#1e2432] tracking-tight leading-tight">
              Welcome back, <span className="text-[#544bfa]">{profile?.name.split(' ')[0]}!</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Track your academic growth and conquer your next assessment.
            </p>
          </div>

          <button
            onClick={() => setShowAI(true)}
            className="flex items-center justify-center gap-3 bg-gradient-to-br from-[#544bfa] to-[#7c3aed] text-white px-10 py-4 rounded-[22px] font-black shadow-[0_20px_40px_-10px_rgba(84,75,250,0.3)] hover:-translate-y-1 transition-all w-full md:w-auto border-t border-white/20"
          >
            <Sparkles size={22} className="animate-pulse" />
            AI Quiz Generator
          </button>
        </div>

        {/* 2. ANALYTICS & GROWTH SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          {/* Quizzes Taken - Persistence Metric */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-[#544bfa]/20 transition-all">
            <div className="w-14 h-14 bg-indigo-50 text-[#544bfa] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Attempts</p>
              <h4 className="text-2xl font-black text-[#1e2432]">
                {stats.totalTaken} <span className="text-sm text-emerald-500 font-bold">+{stats.thisWeek} recently</span>
              </h4>
            </div>
          </div>

          {/* Avg Score - Performance Metric */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-emerald-500/20 transition-all">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck size={28} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Average Performance</p>
              <h4 className="text-2xl font-black text-[#1e2432]">
                {stats.avgScore}% <span className="text-sm text-slate-400 font-bold">{stats.avgScore > 75 ? 'Proficient' : 'Learning'}</span>
              </h4>
            </div>
          </div>

          {/* QUIZ ACCURACY - Mastery Metric */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-orange-500/20 transition-all">
            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles size={28} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Mastery Level</p>
              <h4 className="text-2xl font-black text-[#1e2432]">
                {level}
                <span className="text-sm text-orange-500 font-bold ml-2">Level Up</span>
              </h4>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] border border-slate-100 mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 text-[#544bfa] p-2.5 rounded-2xl"><Search size={22} strokeWidth={3} /></div>
            <h3 className="text-xl font-black text-[#1e2432]">Find Assessments</h3>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <SearchableSelect
              label="Faculty"
              options={FACULTIES}
              value={filters.faculty}
              onChange={(val) => setFilters({ ...filters, faculty: val, department: '' })}
              placeholder="Search faculty..."
            />

            <SearchableSelect
              label="Department"
              options={FACULTY_DATA[filters.faculty] || []}
              value={filters.department}
              onChange={(val) => setFilters({ ...filters, department: val })}
              placeholder="Search department..."
            />

            <div className="w-full md:w-32 relative">
              <select className="w-full p-5 bg-[#f8fafc] rounded-2xl outline-none border-2 border-transparent focus:border-[#544bfa] font-bold text-[#1e2432] cursor-pointer appearance-none pr-10 text-slate-400" value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="w-full md:w-32 relative">
              <select className="w-full p-5 bg-[#f8fafc] rounded-2xl outline-none border-2 border-transparent focus:border-[#544bfa] font-bold text-[#1e2432] cursor-pointer appearance-none pr-10 text-slate-400 " value={filters.section} onChange={e => setFilters({ ...filters, section: e.target.value })}>
                {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Sec {s}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button onClick={searchQuizzes} disabled={isSearching} className="w-full md:w-48 bg-[#544bfa] text-white p-5 rounded-2xl font-black hover:-translate-y-1 shadow-[0_10px_20px_-5px_rgba(84,75,250,0.4)] transition-all flex items-center justify-center gap-2 h-[64px] disabled:opacity-70">
              {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} strokeWidth={3} />}
              Search
            </button>
          </div>
        </div>

        {quizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="group bg-white p-8 rounded-[40px] border border-slate-100 hover:border-[#544bfa]/30 shadow-sm hover:shadow-[0_25px_60px_-15px_rgba(84,75,250,0.15)] transition-all cursor-pointer flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#544bfa] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="bg-[#f0f0fe] text-[#544bfa] px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase">{quiz.title} quiz</span>
                  <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase">{quiz.duration} Mins</span>
                </div>
                <div className="mb-10 text-left">
                  {/* Primary Title: shows the Subject Name */}
                  <h6 className="text-[1.5rem] leading-tight font-black text-[#1e2432] mb-2 pr-10 capitalize">
                    {quiz.subject}
                  </h6>

                  {/* Secondary Details: Title, Dept, Sem, and Sec */}
                  <p className="text-slate-500 font-bold text-sm mb-8 flex flex-wrap items-center gap-2">
                    <BookOpen size={16} className="text-[#544bfa]" />
                    <span>{quiz.department}</span>
                    <span className="text-slate-300">•</span>
                    <span>Semester {quiz.semester}</span>
                    <span className="text-slate-300">•</span>
                    <span>Sec {quiz.section}</span>
                  </p>
                </div>
                <button onClick={() => { setSelectedQuiz(quiz); setStep('verify'); }} className="mt-auto w-full bg-slate-50 text-slate-600 group-hover:bg-[#544bfa] group-hover:text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-sm">Begin Assessment <ChevronRight size={20} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}