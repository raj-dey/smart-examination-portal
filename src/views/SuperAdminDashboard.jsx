import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import {
    BookOpen,
    Check,
    ChevronDown,
    ClipboardList,
    Database,
    Eye,
    Search,
    ShieldAlert,
    Trash2,
    Users
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from '../utils/toast';
import Layout from '../components/Layout';
import { appId, db } from '../firebase';

// Data Mapping for Filter Logic
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
        <div className="flex-1 min-w-[200px] relative" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className={`w-full p-4 bg-white rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${isOpen ? 'border-[#544bfa] shadow-md' : 'border-slate-100'}`}>
                <span className={`font-bold text-sm truncate ${value ? 'text-[#1e2432]' : 'text-slate-400'}`}>{value || label}</span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute top-[110%] left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-50 flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-slate-400" />
                        <input autoFocus className="w-full bg-transparent outline-none font-bold text-xs text-[#1e2432]" placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                        {filtered.length > 0 ? filtered.map(opt => (
                            <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }} className={`p-3 rounded-xl font-bold text-xs cursor-pointer transition-colors flex justify-between items-center ${value === opt ? 'bg-[#f0f0fe] text-[#544bfa]' : 'hover:bg-slate-50 text-slate-600'}`}>
                                {opt} {value === opt && <Check size={14} />}
                            </div>
                        )) : <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No results</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SuperAdminDashboard({ profile }) {
    const [allUsers, setAllUsers] = useState([]);
    const [allQuizzes, setAllQuizzes] = useState([]);
    const [allResults, setAllResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inspectingQuiz, setInspectingQuiz] = useState(null);
    const [filters, setFilters] = useState({ faculty: '', department: '', semester: '', subject: '' });

    const fetchEverything = async () => {
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, 'artifacts', appId, 'users'));
            const quizSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'));
            const resultSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'));

            setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setAllQuizzes(quizSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setAllResults(resultSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        } catch (err) {
            console.error(err);
            toast.error(err);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchEverything(); }, []);

    const filteredQuizzes = useMemo(() => {
        return allQuizzes.filter(q =>
            (!filters.faculty || q.faculty === filters.faculty) &&
            (!filters.department || q.department === filters.department) &&
            (!filters.semester || String(q.semester) === filters.semester) &&
            (!filters.subject || q.subject?.toLowerCase().includes(filters.subject.toLowerCase()))
        );
    }, [allQuizzes, filters]);

    const filteredResults = useMemo(() => {
        return allResults.filter(r =>
            (!filters.faculty || r.faculty === filters.faculty) &&
            (!filters.department || r.department === filters.department) &&
            (!filters.semester || String(r.semester) === filters.semester)
        );
    }, [allResults, filters]);

    const subjectsList = useMemo(() => [...new Set(allQuizzes.map(q => q.subject))].filter(Boolean), [allQuizzes]);

    // DELETE FUNCTION
    const deleteAnyData = async (pathSegments, id) => {
        if (!window.confirm("SUPREME ACTION: Delete this record permanently from the database?")) return;

        const toastId = toast.loading("Executing Supreme Wipe...");
        try {
            // Correctly constructing the doc reference using segment array
            const docRef = doc(db, 'artifacts', appId, ...pathSegments, id);
            await deleteDoc(docRef);

            toast.success("Record erased successfully.", { id: toastId });

            // Critical: Refresh local state so UI updates
            await fetchEverything();
        } catch (err) {
            console.error("SUPREME DELETE ERROR:", err);
            toast.error(err, { id: toastId });
        }
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse">ACCESSING MASTER CONTROL...</div>;

    return (
        <Layout profile={profile}>
            <div className="max-w-7xl mx-auto py-8 space-y-10">

                <div className="bg-[#1e2432] p-10 rounded-[40px] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert className="text-red-500" size={20} />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-red-500">System Administrator</span>
                        </div>
                        <h1 className="text-4xl font-black">Database Master Control</h1>
                    </div>
                    <p className="font-mono text-indigo-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10">{appId}</p>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Search size={20} /> Global Data Filters</h3>
                    <div className="flex flex-wrap gap-4">
                        <SearchableSelect label="All Faculties" options={FACULTIES} value={filters.faculty} onChange={v => setFilters({ ...filters, faculty: v, department: '' })} placeholder="Search Faculty..." />
                        <SearchableSelect label="All Departments" options={FACULTY_DATA[filters.faculty] || []} value={filters.department} onChange={v => setFilters({ ...filters, department: v })} placeholder="Search Dept..." />
                        <select className="flex-1 min-w-[120px] p-4 bg-white rounded-2xl border-2 border-slate-100 font-bold text-sm text-slate-400 outline-none focus:border-[#544bfa] appearance-none" value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
                            <option value="">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                        <SearchableSelect label="All Subjects" options={subjectsList} value={filters.subject} onChange={v => setFilters({ ...filters, subject: v })} placeholder="Search Subject..." />
                        <button onClick={() => setFilters({ faculty: '', department: '', semester: '', subject: '' })} className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all text-sm">Reset</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={30} /></div>
                        <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Users</p><h4 className="text-3xl font-black">{allUsers.length}</h4></div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><BookOpen size={30} /></div>
                        <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Quizzes</p><h4 className="text-3xl font-black">{filteredQuizzes.length}</h4></div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Database size={30} /></div>
                        <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Global Records</p><h4 className="text-3xl font-black">{filteredResults.length}</h4></div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                        <ClipboardList className="text-indigo-600" />
                        <h3 className="text-xl font-black text-slate-800">Quiz Monitor (Filtered)</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-white text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                            <tr><th className="p-6">Assessment</th><th className="p-6">Faculty/Dept</th><th className="p-6 text-center">PIN</th><th className="p-6 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredQuizzes.map(q => (
                                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6"><p className="font-black text-slate-800">{q.title}</p><p className="text-indigo-500 font-bold text-xs uppercase">{q.subject}</p></td>
                                    <td className="p-6 font-bold text-slate-500">{q.faculty}<br /><span className="text-[10px] text-slate-400 uppercase">{q.department}</span></td>
                                    <td className="p-6 text-center"><span className="font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{q.pin}</span></td>
                                    <td className="p-6 flex justify-center gap-3">
                                        <button onClick={() => setInspectingQuiz(q)} className="p-2 bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"><Eye size={18} /></button>
                                        <button onClick={() => deleteAnyData(['public', 'data', 'quizzes'], q.id)} className="p-2 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                        <Database className="text-emerald-600" />
                        <h3 className="text-xl font-black text-slate-800">Results Ledger (Filtered)</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-white text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                            <tr><th className="p-6">Student</th><th className="p-6">Assessment</th><th className="p-6 text-right">Score</th><th className="p-6 text-center">Delete</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredResults.map(res => (
                                <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6"><p className="font-black text-slate-800">{res.name}</p><p className="text-xs font-mono font-bold text-slate-400">{res.id}</p></td>
                                    <td className="p-6 font-bold text-slate-600">{res.quizTitle}</td>
                                    <td className="p-6 text-right"><span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black">{res.score} / {res.total}</span></td>
                                    <td className="p-6 text-center">
                                        <button
                                            onClick={() => deleteAnyData(['public', 'data', 'submissions'], res.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="text-blue-600" />
                            <h3 className="text-xl font-black text-slate-800">User Account Directory</h3>
                        </div>
                        <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">
                            {allUsers.length} Registered Accounts
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                    <th className="p-6">User / Login Email</th>
                                    <th className="p-6">System Role</th>
                                    <th className="p-6">Academic Node</th>
                                    <th className="p-6 text-center">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {allUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <p className="font-black text-slate-800">{user.name || 'Anonymous'}</p>
                                            <p className="text-xs font-bold text-indigo-500 font-mono select-all">{user.email || 'Email via Social Auth'}</p>
                                            <p className="text-[10px] text-slate-300 mt-1 font-mono uppercase tracking-tighter">UID: {user.id}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-50 text-red-600' : user.role === 'teacher' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-6 font-bold text-slate-500">
                                            <p>{user.faculty || 'Unassigned'}</p>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{user.department || 'General Access'}</p>
                                        </td>
                                        <td className="p-6 text-center">
                                            <button onClick={() => deleteAnyData(['users'], user.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-xl">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {inspectingQuiz && (
                    <div className="fixed inset-0 bg-[#1e2432]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[40px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-[#1e2432]">{inspectingQuiz.subject}</h2>
                                    <p className="text-sm font-bold text-slate-500">{inspectingQuiz.title} • {inspectingQuiz.questions.length} Questions</p>
                                </div>
                                <button onClick={() => setInspectingQuiz(null)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm font-black">ESC</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {inspectingQuiz.questions.map((q, idx) => (
                                    <div key={idx} className="bg-white border border-slate-100 p-6 rounded-3xl">
                                        <div className="flex gap-4 mb-4">
                                            <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</span>
                                            <h4 className="font-bold text-lg text-slate-800">{q.text}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className={`p-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-between ${q.correct === optIdx ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-transparent bg-slate-50 text-slate-500'}`}>
                                                    {opt} {q.correct === optIdx && <Check size={16} strokeWidth={3} />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}