import { addDoc, collection } from 'firebase/firestore';
import { ArrowLeft, Check, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from '../utils/toast';
import { appId, auth, db } from '../firebase';

// Data mapping for Faculties and Departments
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

// --- Reusable Searchable Select for Create Quiz ---
function SearchableSelect({ label, options, value, onChange, placeholder, disabled = false }) {
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
    <div className="w-full relative" ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${disabled ? 'bg-[#f1f5f9] cursor-not-allowed border-transparent' : 'bg-[#f8fafc] cursor-pointer border-transparent focus-within:border-[#544bfa]'} ${isOpen ? 'border-[#544bfa] bg-white shadow-md' : ''}`}
      >
        <span className={`font-bold truncate ${disabled ? 'text-slate-400' : (value ? 'text-[#1e2432]' : 'text-[#94a3b8]')}`}>
          {value || label}
        </span>
        {!disabled && <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
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
              <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No matching departments</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateQuiz({ profile, onBack }) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [quizData, setQuizData] = useState({
    title: '',
    subject: '',
    semester: '1',
    section: 'A',
    duration: '15',
    department: '',
    faculty: profile?.faculty || ''
  });
  
  const [questions, setQuestions] = useState([{ text: '', options: ['', '', '', ''], correct: 0 }]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correct: 0 }]);
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const saveQuiz = async () => {
    if(!quizData.title || !quizData.department) return toast.error("Please fill in Quiz Title and Department");
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setIsPublishing(true);

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), {
        ...quizData,
        questions,
        pin,
        faculty: quizData.faculty,
        teacherUid: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      toast.success(`Quiz Published! PIN: ${pin}`);
      onBack();
    } catch (err) { 
      toast.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 font-sans text-[#1e2432]">
      <div className="max-w-4xl mx-auto">
        
        <button onClick={onBack} className="flex items-center gap-2 text-[#64748b] font-bold mb-6 hover:text-[#544bfa] transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-white p-10 rounded-[40px] border border-[#f1f5f9] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] mb-8">
          <h2 className="text-[2rem] font-black tracking-tight mb-8">Create Assessment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input className="w-full p-4 bg-[#f8fafc] rounded-2xl border-2 border-transparent focus:border-[#544bfa] outline-none font-bold text-[#1e2432] transition-colors placeholder-[#94a3b8]" placeholder="Quiz Title" value={quizData.title} onChange={e => setQuizData({...quizData, title: e.target.value})} />
            <input className="w-full p-4 bg-[#f8fafc] rounded-2xl border-2 border-transparent focus:border-[#544bfa] outline-none font-bold text-[#1e2432] transition-colors placeholder-[#94a3b8]" placeholder="Subject" value={quizData.subject} onChange={e => setQuizData({...quizData, subject: e.target.value})} />
            
            {/* Faculty - Auto-filled and Disabled for Security */}
            <SearchableSelect 
              label="Faculty"
              options={[]}
              value={quizData.faculty}
              disabled={true}
            />

            {/* Department - Searchable and Filtered */}
            <SearchableSelect 
              label="Select Department"
              options={FACULTY_DATA[quizData.faculty] || []}
              value={quizData.department}
              onChange={(val) => setQuizData({...quizData, department: val})}
              placeholder="Type to search department..."
            />
            
            <div className="flex gap-4 md:col-span-2">
              <select className="flex-1 p-4 bg-[#f8fafc] rounded-2xl border-2 border-transparent focus:border-[#544bfa] outline-none font-bold text-[#1e2432] cursor-pointer appearance-none text-slate-500" value={quizData.semester} onChange={e => setQuizData({...quizData, semester: e.target.value})}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
              
              <select className="flex-1 p-4 bg-[#f8fafc] rounded-2xl border-2 border-transparent focus:border-[#544bfa] outline-none font-bold text-[#1e2432] cursor-pointer appearance-none text-slate-500" value={quizData.section} onChange={e => setQuizData({...quizData, section: e.target.value})}>
                {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Sec {s}</option>)}
              </select>

              <input type="number" className="w-24 p-4 bg-[#f8fafc] rounded-2xl border-2 border-transparent focus:border-[#544bfa] outline-none font-bold text-[#1e2432] transition-colors placeholder-[#94a3b8]" placeholder="Mins" value={quizData.duration} onChange={e => setQuizData({...quizData, duration: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white p-8 rounded-[40px] border border-[#f1f5f9] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] relative transition-all hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]">
              <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))} className="absolute top-8 right-8 text-[#cbd5e1] hover:text-red-500 transition-colors">
                <X size={24} strokeWidth={2.5} />
              </button>
              <input className="w-full text-xl font-bold border-b-2 border-[#f1f5f9] pb-3 mb-6 outline-none focus:border-[#544bfa] text-[#1e2432] transition-colors placeholder-[#94a3b8]" placeholder="Enter Question text..." value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${q.correct === i ? 'border-[#544bfa] bg-[#f0f0fe]' : 'border-transparent bg-[#f8fafc] hover:border-[#e2e8f0]'}`}>
                    <input type="radio" name={`correct-${qIdx}`} className="w-5 h-5 accent-[#544bfa] cursor-pointer" checked={q.correct === i} onChange={() => updateQuestion(qIdx, 'correct', i)} />
                    <input className="flex-1 bg-transparent outline-none text-sm font-bold text-[#1e2432]" placeholder={`Option ${i + 1}`} value={opt} onChange={e => updateOption(qIdx, i, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col md:flex-row gap-6 mb-20">
          <button onClick={handleAddQuestion} className="flex-1 py-4 flex items-center justify-center gap-2 border-2 border-dashed border-[#cbd5e1] rounded-[24px] font-black text-[#64748b] hover:border-[#544bfa] hover:text-[#544bfa] transition-all hover:bg-[#f0f0fe]">
            <Plus size={20} strokeWidth={3} /> Add Another Question
          </button>
          <button onClick={saveQuiz} disabled={isPublishing} className="flex-1 bg-[#544bfa] text-white py-4 rounded-[24px] font-black flex items-center justify-center gap-2 disabled:opacity-70 shadow-[0_15px_30px_-5px_rgba(84,75,250,0.4)] transition-all">
            {isPublishing ? <Loader2 className="animate-spin" size={20} /> : 'Publish Assessment'}
          </button>
        </div>

      </div>
    </div>
  );
}