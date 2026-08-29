import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { BookOpen, Check, ChevronDown, ChevronRight, ClipboardList, Loader2, Plus, Search, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from '../utils/toast';
import Layout from '../components/Layout';
import { appId, auth, db } from '../firebase';
import CreateQuiz from './CreateQuiz';

// 1. Centralized Data
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

// Custom Searchable Dropdown Component
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
    <div className="flex-1 min-w-[180px] relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 bg-white rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${isOpen ? 'border-[#544bfa] shadow-sm' : 'border-slate-100'}`}
      >
        <span className={`font-bold text-sm truncate ${value ? 'text-[#1e2432]' : 'text-slate-400'}`}>
          {value || label}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-slate-50 flex items-center gap-2 bg-slate-50">
            <Search size={14} className="text-slate-400" />
            <input
              autoFocus className="w-full bg-transparent outline-none font-bold text-xs text-[#1e2432]"
              placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length > 0 ? filtered.map(opt => (
              <div
                key={opt} onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                className={`p-2.5 rounded-lg font-bold text-xs cursor-pointer transition-colors flex justify-between items-center ${value === opt ? 'bg-[#f0f0fe] text-[#544bfa]' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                {opt} {value === opt && <Check size={14} />}
              </div>
            )) : <div className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard({ profile }) {
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [isLoading, setIsLoading] = useState(true);

  const [filterInputs, setFilterInputs] = useState({ department: '', subject: '', semester: '', section: '', quizTitle: '' });
  const [appliedFilters, setAppliedFilters] = useState({ department: '', subject: '', semester: '', section: '', quizTitle: '' });

  const [isSearching, setIsSearching] = useState(false); // New state for search spinner
  const [isDeletingId, setIsDeletingId] = useState(null); // New state for delete spinner

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const qQuizzes = query(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), where('teacherUid', '==', auth.currentUser.uid));
      const quizSnap = await getDocs(qQuizzes);
      setQuizzes(quizSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      if (profile?.faculty) {
        //Only fetches submissions for YOUR quizzes
        const qSubs = query(
          collection(db, 'artifacts', appId, 'public', 'data', 'submissions'),
          where('teacherUid', '==', auth.currentUser.uid) // Filter by your unique ID
        );
        const subSnap = await getDocs(qSubs);
        setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    } catch (err) {
      console.error(err);
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Generate a unique, alphabetized list of subjects from active quizzes
  const activeSubjects = useMemo(() => {
    const subjects = quizzes.map(q => q.subject).filter(Boolean);
    return [...new Set(subjects)].sort();
  }, [quizzes]);

  // UPDATED: Advanced Delete Function (Deletes Quiz + All Associated Scores)
  const handleDelete = async (id) => {
    const quizToDelete = quizzes.find(q => q.id === id);
    if (!quizToDelete) return;

    if (!window.confirm(`Are you sure you want to delete "${quizToDelete.title}"?\n\nThis will permanently delete the assessment AND all student scores/attempts associated with it. This cannot be undone.`)) return;

    setIsDeletingId(id); // Set the specific ID being deleted
    const toastId = toast.loading("Deleting assessment and student records...");

    try {
      // 1. Delete the main Quiz document from Firebase
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', id));

      // 2. Find all Submissions linked to this quiz
      const qSubs = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'submissions'),
        where('quizTitle', '==', quizToDelete.title),
        where('faculty', '==', profile.faculty)
      );
      const subSnap = await getDocs(qSubs);

      // 3. Delete all those Submissions from Firebase simultaneously
      const deletePromises = subSnap.docs.map(d => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'submissions', d.id)));
      await Promise.all(deletePromises);

      // 4. Update the local React state instantly so the UI removes them without refreshing
      setQuizzes(quizzes.filter(q => q.id !== id));
      setSubmissions(submissions.filter(s => s.quizTitle !== quizToDelete.title));

      toast.success(`Deleted assessment and ${subSnap.docs.length} student record(s).`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error, { id: toastId });
    } finally {
      setIsDeletingId(null); // Reset
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
    setAppliedFilters({ ...filterInputs, quizTitle: '' });
    // Simulate a tiny delay for visual feedback or wait for filter logic
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleClearFilters = () => {
    setFilterInputs({ department: '', subject: '', semester: '', section: '', quizTitle: '' });
    setAppliedFilters({ department: '', subject: '', semester: '', section: '', quizTitle: '' });
  };

  const handleViewAttempts = (quizTitle) => {
    const specificFilter = { department: '', subject: '', semester: '', section: '', quizTitle: quizTitle };
    setFilterInputs(specificFilter);
    setAppliedFilters(specificFilter);
    setActiveTab('results');
  };

  const filteredSubmissions = submissions.filter(sub => {
    const relatedQuiz = quizzes.find(q => q.title === sub.quizTitle) || {};

    const dept = String(sub.department || relatedQuiz.department || '').toLowerCase();
    const subj = String(sub.subject || relatedQuiz.subject || '').toLowerCase();
    const sem = String(sub.semester || relatedQuiz.semester || '');
    const sec = String(sub.section || relatedQuiz.section || '');

    const matchDept = !appliedFilters.department || dept.includes(appliedFilters.department.toLowerCase());
    const matchSubj = !appliedFilters.subject || subj.includes(appliedFilters.subject.toLowerCase());
    const matchSem = !appliedFilters.semester || sem === String(appliedFilters.semester);
    const matchSec = !appliedFilters.section || sec === String(appliedFilters.section);

    const matchTitle = !appliedFilters.quizTitle || sub.quizTitle === appliedFilters.quizTitle;

    return matchDept && matchSubj && matchSem && matchSec && matchTitle;
  });

  const overviewStats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    const totalAttempts = submissions.length;

    // Calculate Average Score across ALL your submissions
    let avgScore = 0;
    if (totalAttempts > 0) {
      const totalPercentage = submissions.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0);
      avgScore = Math.round(totalPercentage / totalAttempts);
    }

    return { totalQuizzes, totalAttempts, avgScore };
  }, [quizzes, submissions]);

  const filteredStats = useMemo(() => {
    const count = filteredSubmissions.length;
    if (count === 0) return { count: 0, avg: 0, passRate: 0 };

    const percentages = filteredSubmissions.map(s => (s.score / s.total) * 100);
    const avg = Math.round(percentages.reduce((a, b) => a + b, 0) / count);

    //Pass Rate (Students scoring 50% or more)
    const passCount = percentages.filter(p => p >= 50).length;
    const passRate = Math.round((passCount / count) * 100);

    return { count, avg, passRate };
  }, [filteredSubmissions]);

  if (isCreating) {
    return <CreateQuiz profile={profile} onBack={() => { setIsCreating(false); fetchDashboardData(); }} />;
  }

  return (
    <Layout profile={profile}>
      <div className="max-w-7xl mx-auto py-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-[2.5rem] font-black text-[#1e2432] tracking-tight mb-2">Welcome, <span className='text-[#544bfa]'>{profile?.name || 'Faculty'}</span></h1>
            <p className="text-slate-500 font-medium text-lg">{profile?.faculty ? `Faculty of ${profile.faculty}` : 'Manage your assessments and view student performance.'}</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-[#544bfa] text-white px-8 py-4 rounded-2xl font-black hover:-translate-y-1 shadow-[0_10px_20px_-5px_rgba(84,75,250,0.4)] transition-all flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <Plus size={20} strokeWidth={3} /> Create New Quiz
          </button>
        </div>

        {/* DYNAMIC INFORMATION BOXES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {activeTab === 'quizzes' ? (
            <>
              {/* Box 1: Total Quizzes */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-50 text-[#544bfa] rounded-[24px] flex items-center justify-center">
                  <ClipboardList size={30} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Total Quizzes</p>
                  <h4 className="text-3xl font-black text-[#544bfa]">{overviewStats.totalQuizzes}</h4>
                </div>
              </div>
              {/* Box 2: Total Attempts */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center">
                  <Users size={30} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Total Attempts</p>
                  <h4 className="text-3xl font-black text-emerald-600">{overviewStats.totalAttempts}</h4>
                </div>
              </div>
              {/* Box 3: Avg. Score (Overall) */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-[24px] flex items-center justify-center">
                  <Check size={30} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Avg. Score</p>
                  <h4 className="text-3xl font-black text-orange-600">{overviewStats.avgScore}%</h4>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Result Tab Box 1: Filtered Attempts */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[24px] flex items-center justify-center">
                  <Search size={30} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Total Attempts</p>
                  <h4 className="text-3xl font-black text-blue-600">{filteredStats.count}</h4>
                </div>
              </div>
              {/* Result Tab Box 2: Filtered Avg Score */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center">
                  <Check size={30} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Avg. Percentage</p>
                  <h4 className="text-3xl font-black text-emerald-600">{filteredStats.avg}%</h4>
                </div>
              </div>
              {/* Result Tab Box 3: Success Rate (Meaningful for Teachers) */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-[24px] flex items-center justify-center">
                  <BookOpen size={30} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Success Rate</p>
                  <h4 className="text-3xl font-black text-purple-600">{filteredStats.passRate}%</h4>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-8 mb-10 border-b-2 border-slate-100">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`pb-4 px-2 text-lg font-black transition-all border-b-4 -mb-[2px] ${activeTab === 'quizzes' ? 'border-[#544bfa] text-[#544bfa]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            My Assessments
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-4 px-2 text-lg font-black transition-all border-b-4 -mb-[2px] ${activeTab === 'results' ? 'border-[#544bfa] text-[#544bfa]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Student Results
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-20 font-bold text-slate-400 animate-pulse">Loading dashboard...</div>
        )}

        {/* Tab Content: My Assessments */}
        {!isLoading && activeTab === 'quizzes' && (
          quizzes.length === 0 ? (
            <div className="bg-white rounded-[40px] border border-slate-100 p-16 text-center shadow-sm">
              <div className="w-24 h-24 bg-[#f0f0fe] text-[#544bfa] rounded-[32px] flex items-center justify-center mx-auto mb-6"><BookOpen size={48} /></div>
              <h3 className="text-2xl font-black text-[#1e2432] mb-2">No Assessments Yet</h3>
              <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">You haven't created any quizzes yet. Click the button above to create your first secure assessment.</p>
              <button onClick={() => setIsCreating(true)} className="bg-[#1e2432] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors">Create Assessment</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="group bg-white p-8 rounded-[32px] border border-slate-100 hover:border-[#544bfa]/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(84,75,250,0.15)] transition-all relative flex flex-col overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#544bfa] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <button
                    onClick={() => handleDelete(quiz.id)}
                    disabled={isDeletingId === quiz.id}
                    className="absolute top-6 right-6 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                  >
                    {isDeletingId === quiz.id ? (
                      <Loader2 size={20} className="animate-spin text-red-500" />
                    ) : (
                      <Trash2 size={20} strokeWidth={2.5} />
                    )}
                  </button>

                  {/* Interactive PIN Badge with Copy Feature */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="bg-[#f0f0fe] text-[#544bfa] px-4 py-1.5 rounded-xl text-sm font-black tracking-widest border border-[#544bfa]/10 flex items-center gap-2 group/pin">
                      <span>PIN: {quiz.pin}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(quiz.pin);
                          toast.success("PIN copied to clipboard!");
                        }}
                        className="text-slate-400 hover:text-[#544bfa] transition-colors p-1 rounded-md hover:bg-white shadow-sm"
                        title="Copy PIN"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Primary Title: shows the Subject Name */}
                  <h6 className="text-[1.5rem] leading-tight font-black text-[#1e2432] mb-2 pr-10 capitalize">
                    {quiz.subject}
                  </h6>

                  {/* Secondary Details: Title, Dept, Sem, and Sec */}
                  <p className="text-slate-500 font-bold text-sm mb-8 flex flex-wrap items-center gap-2">
                    <BookOpen size={16} className="text-[#544bfa]" />
                    <span>{quiz.title}</span>
                    <span className="text-slate-300">•</span>
                    <span>{quiz.department}</span>
                    <span className="text-slate-300">•</span>
                    <span>Semester {quiz.semester}</span>
                    <span className="text-slate-300">•</span>
                    <span>Sec {quiz.section}</span>
                  </p>

                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between font-bold text-sm">
                    <button
                      onClick={() => handleViewAttempts(quiz.title)}
                      className="flex items-center gap-2 text-slate-500 hover:text-[#544bfa] transition-colors group/btn cursor-pointer py-1"
                      title="View Scores"
                    >
                      <Users size={16} className="group-hover/btn:text-[#544bfa] transition-colors" />
                      <span className="text-[#1e2432] group-hover/btn:text-[#544bfa] transition-colors">
                        {submissions.filter(s => s.quizTitle === quiz.title).length}
                      </span> Attempts
                      <ChevronRight size={14} className="opacity-0 group-hover/btn:opacity-100 -ml-1 transition-all" />
                    </button>
                    <span className="text-xs uppercase tracking-widest bg-slate-100 text-slate-400 px-2 py-1 rounded-md">{quiz.duration}m</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab Content: Student Results */}
        {!isLoading && activeTab === 'results' && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-8 md:p-10 border-b border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><ClipboardList size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-[#1e2432]">Recent Submissions</h3>
                <p className="text-sm font-medium text-slate-500">Live feed of completed assessments across your faculty.</p>
              </div>
            </div>

            {appliedFilters.quizTitle && (
              <div className="bg-[#f0f0fe] px-10 py-4 flex items-center justify-between border-b border-[#544bfa]/10">
                <p className="text-sm font-bold text-[#544bfa]">
                  Showing scoreboard for assessment: <span className="font-black text-lg ml-2">{appliedFilters.quizTitle}</span>
                </p>
                <button onClick={handleClearFilters} className="text-sm font-bold text-slate-500 hover:text-[#1e2432] underline">
                  View All Submissions
                </button>
              </div>
            )}

            {!appliedFilters.quizTitle && (
              <div className="bg-[#f8fafc] p-6 border-b border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <SearchableSelect
                    label="Department"
                    options={FACULTY_DATA[profile?.faculty] || []}
                    value={filterInputs.department}
                    onChange={(val) => setFilterInputs({ ...filterInputs, department: val })}
                    placeholder="Search department..."
                  />
                  <SearchableSelect
                    label="Subject Name"
                    options={activeSubjects}
                    value={filterInputs.subject}
                    onChange={(val) => setFilterInputs({ ...filterInputs, subject: val })}
                    placeholder="Search published subjects..."
                  />
                  <select
                    className="w-full p-3.5 bg-white rounded-xl outline-none border border-slate-200 focus:border-[#544bfa] font-bold text-sm text-[#1e2432] cursor-pointer appearance-none pr-10 transition-all text-slate-400 "
                    value={filterInputs.semester}
                    onChange={e => setFilterInputs({ ...filterInputs, semester: e.target.value })}
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                  <select
                    className="w-full p-3.5 bg-white rounded-xl outline-none border border-slate-200 focus:border-[#544bfa] font-bold text-sm text-[#1e2432] cursor-pointer appearance-none pr-10 transition-al text-slate-400"
                    value={filterInputs.section}
                    onChange={e => setFilterInputs({ ...filterInputs, section: e.target.value })}
                  >
                    <option value="">All Sections</option>
                    {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>

                  <div className="col-span-1 md:col-span-2 flex gap-2">
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="flex-1 bg-[#544bfa] text-white rounded-[14px] font-bold hover:bg-[#4338ca] shadow-[0_5px_15px_-3px_rgba(84,75,250,0.4)] transition-all flex justify-center items-center gap-2"
                    >
                      {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      Search
                    </button>
                    <button
                      onClick={handleClearFilters}
                      className="flex-1 bg-slate-200 text-slate-600 rounded-[14px] font-bold hover:bg-slate-300 transition-colors text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">Student</th>
                    <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">ID</th>
                    <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">Assessment</th>
                    <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr><td colSpan="4" className="p-10 text-center font-bold text-slate-400 bg-slate-50/50">No results match your criteria.</td></tr>
                  ) : (
                    filteredSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-black text-[#1e2432]">{sub.name}</td>
                        <td className="p-6 font-bold text-slate-500 font-mono">{sub.id}</td>
                        <td className="p-6 font-bold text-slate-600">{sub.quizTitle}</td>
                        <td className="p-6 text-right">
                          <span className={`px-4 py-2 rounded-xl font-black text-sm inline-block min-w-[4.5rem] text-center ${sub.score > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                            {sub.score} / {sub.total}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}