import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Briefcase, ChevronDown, GraduationCap, Loader2, Users } from 'lucide-react';
import { useState } from 'react';
import toast from '../utils/toast';
import { appId, auth, db } from '../firebase';
import './LandingPage.css';



// Centralized list of faculties to ensure data consistency
const FACULTIES = [
  "Nursing", "Science", "Engineering", "Computer Technology",
  "Paramedical Sciences", "Pharmaceutical Science", "Commerce and Management",
  "Humanities and Social Sciences", "Physiotherapy and Rehabilitation",
  "Agricultural Sciences and Technology"
];

export default function LandingPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', faculty: '' });
  const [isLoading, setIsLoading] = useState(false);

  //google sign in
  const [isSocialRegister, setIsSocialRegister] = useState(false);
  const [socialUser, setSocialUser] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegister && !form.faculty) return toast.error("Please select your Faculty");

    setIsLoading(true);
    try {
      if (isRegister) {
        const res = await createUserWithEmailAndPassword(auth, form.email, form.password);
        // Storing the clean faculty name to the user profile
        await setDoc(doc(db, 'artifacts', appId, 'users', res.user.uid), {
          name: form.name,
          faculty: form.faculty,
          role: role,
          uid: res.user.uid
        });
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
    } catch (err) {
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="landing-wrapper">
        <div className="content-container">
          <div className="main-logo-container">
            <div className="main-logo-glow"></div>
            <div className="main-logo-box"><GraduationCap size={52} strokeWidth={2.5} /></div>
          </div>
          <h1 className="text-[3.5rem] font-black tracking-tight mb-4" style={{ color: 'var(--text-main)' }}>
            University <span style={{ color: 'var(--brand-blue)' }}>QuizPro</span>
          </h1>
          <div className="cards-grid">
            <div className="role-card student" onClick={() => setRole('student')}>
              <div className="icon-box student"><Users size={32} strokeWidth={2.5} /></div>
              <h2 className="text-[1.75rem] font-black mb-2 tracking-tight">Student Portal</h2>
              <p className="font-medium">Find and begin your assessments.</p>
            </div>
            <div className="role-card teacher" onClick={() => setRole('teacher')}>
              <div className="icon-box teacher"><Briefcase size={32} strokeWidth={2.5} /></div>
              <h2 className="text-[1.75rem] font-black mb-2 tracking-tight">Teacher Login</h2>
              <p className="font-medium">Manage exams and monitor activity.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const handleForgotPassword = async () => {
    if (!form.email) {
      return toast.error("Please enter your email address first."); //
    }

    const toastId = toast.loading("Sending reset link...");
    try {
      await sendPasswordResetEmail(auth, form.email); //
      toast.success("Link sent! Please check your Inbox and Spam folder.", {
        id: toastId,
        duration: 6000
      });
    } catch (err) {
      toast.error(err, { id: toastId }); //
    }
  };

  //google sign-in handler
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider(); //
    setIsLoading(true);
    try {
      const res = await signInWithPopup(auth, provider); //
      const userRef = doc(db, 'artifacts', appId, 'users', res.user.uid);
      const userSnap = await getDoc(userRef); //

      if (!userSnap.exists()) {
        // New User: Store info and show the selection form
        setSocialUser(res.user);
        setForm({ ...form, name: res.user.displayName });
        setIsSocialRegister(true);
        toast("Please complete your profile details.");
      } else {
        toast.success("Welcome back!"); //
      }
    } catch (err) {
      toast.error(err); //
    } finally {
      setIsLoading(false);
    }
  };


  //google
  if (isSocialRegister) {
    return (
      <div className="landing-wrapper">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100 animate-in fade-in zoom-in duration-300">
          <h2 className="text-3xl font-black mb-2 text-center text-[#1e2432]">Complete Profile</h2>
          <p className="text-slate-400 text-center font-bold mb-8 text-sm uppercase tracking-widest">Select your details</p>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 ml-1 uppercase">Full Name</label>
              <input
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none font-bold focus:border-[#544bfa]"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 ml-1 uppercase">Faculty</label>
              <div className="relative">
                <select
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none font-bold focus:border-[#544bfa] appearance-none cursor-pointer"
                  value={form.faculty}
                  onChange={e => setForm({ ...form, faculty: e.target.value })}
                >
                  <option value="" disabled>Select Faculty</option>
                  {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>

            <button
              onClick={async () => {
                if (!form.faculty) return toast.error("Please select a faculty.");
                setIsLoading(true);
                try {
                  await setDoc(doc(db, 'artifacts', appId, 'users', socialUser.uid), {
                    name: form.name,
                    faculty: form.faculty,
                    role: role, // Use the role they clicked (teacher or student)
                    uid: socialUser.uid
                  });
                  toast.success("Profile created successfully!"); //
                  setIsSocialRegister(false);
                  setSocialUser(null);

                  // 3. FORCE REDIRECT: Reload to let App.jsx fetch the new profile
                  // This is necessary because the Auth state already changed when Google logged in.
                  window.location.reload();

                } catch (err) {
                  toast.error(err); //
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 mt-4"
              style={{ backgroundColor: role === 'teacher' ? 'var(--brand-green)' : 'var(--brand-blue)' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Finish Setup'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-wrapper">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md relative border border-slate-100">
        <button onClick={() => { setRole(null); setIsRegister(false); }} className="absolute top-8 left-8 text-slate-400 hover:text-indigo-600 flex items-center gap-2 font-bold text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <h2 className="text-3xl font-black mb-8 capitalize text-center mt-6" style={{ color: 'var(--text-main)' }}>
          {role} {isRegister ? 'Registration' : 'Login'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none font-bold focus:border-[#544bfa]" placeholder="Full Name" onChange={e => setForm({ ...form, name: e.target.value })} />

              {/* NEW: Faculty Selection Dropdown */}
              <div className="relative">
                <select
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none font-bold focus:border-[#544bfa] appearance-none cursor-pointer text-slate-700"
                  value={form.faculty}
                  onChange={e => setForm({ ...form, faculty: e.target.value })}
                >
                  <option value="" disabled>Select Your Faculty</option>
                  {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={20} />
                </div>
              </div>
            </>
          )}
          <input required type="email" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none font-bold focus:border-[#544bfa]" placeholder="Email Address" onChange={e => setForm({ ...form, email: e.target.value })} />
          <input required type="password" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none font-bold focus:border-[#544bfa]" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
          {/* NEW: Forgot Password Link */}
          {!isRegister && (
            <div className="flex justify-end pr-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-slate-400 hover:text-[#544bfa] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button disabled={isLoading} className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ backgroundColor: role === 'teacher' ? 'var(--brand-green)' : 'var(--brand-blue)' }}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? 'Create Account' : `Login as ${role}`)}
          </button>
        </form>

        <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-6 text-sm font-bold text-slate-400 hover:text-slate-600">
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>

        {/* Google Sign-In Button */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or continue with</span></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

      </div>
    </div>
  );
}