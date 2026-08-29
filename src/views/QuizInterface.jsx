import { addDoc, collection } from 'firebase/firestore';
import { Bookmark, Loader2, SkipForward } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from '../utils/toast';
import AntiCheat from '../components/AntiCheat';
import { appId, auth, db } from '../firebase';

export default function QuizInterface({ quiz, studentData, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [strikes, setStrikes] = useState(0); // Track strikes for cheating attempts

  // Track the status of each question (answered, review, skipped)
  const [questionStatus, setQuestionStatus] = useState({});

  // Add the isAutoSubmit parameter (defaults to false)
  const submitQuiz = async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const score = quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        ...studentData,
        quizTitle: quiz.title,
        faculty: quiz.faculty,
        teacherUid: quiz.teacherUid, 
        score,
        total: quiz.questions.length,
        timestamp: new Date().toISOString(),
        studentUid: auth.currentUser?.uid || 'anonymous'
      });

      // Check how it was submitted to determine the color
      if (isAutoSubmit) {
        toast.error(`Time's up! Auto-submitted. Score: ${score}/${quiz.questions.length}`, {
          icon: '⏳',
          duration: 5000,
        }); // Red toast
      } else {
        toast.success(`Quiz Submitted! Score: ${score}/${quiz.questions.length}`, {
          duration: 4000,
        }); // Green toast
      }

      onComplete();
    } catch (error) {
      console.error("Submission failed: ", error);
      toast.error(error);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitting) {
      submitQuiz(true);
      return;
    }
    if (timeLeft > 0 && !isSubmitting) {
      const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitting]);

  // Handlers for the new features
  const handleAnswerSelect = (optIdx) => {
    setAnswers({ ...answers, [currentIdx]: optIdx });
    setQuestionStatus({ ...questionStatus, [currentIdx]: 'answered' }); // Turns Blue
  };

  const handleMarkReview = () => {
    setQuestionStatus({ ...questionStatus, [currentIdx]: 'review' }); // Turns Yellow
    if (currentIdx < quiz.questions.length - 1) setCurrentIdx(p => p + 1);
  };

  const handleSkipLeave = () => {
    // Optionally remove answer if they explicitly click "Leave"
    const newAnswers = { ...answers };
    delete newAnswers[currentIdx];
    setAnswers(newAnswers);

    setQuestionStatus({ ...questionStatus, [currentIdx]: 'skipped' }); // Turns Red
    if (currentIdx < quiz.questions.length - 1) setCurrentIdx(p => p + 1);
  };

  // Helper to determine the color of the palette boxes
  const getBoxClass = (idx) => {
    let base = "w-12 h-12 rounded-xl font-bold flex items-center justify-center transition-all border-2 text-sm cursor-pointer ";

    // Highlight the currently active question
    if (currentIdx === idx) {
      base += "ring-4 ring-[#544bfa]/30 scale-110 shadow-lg z-10 ";
    }

    const status = questionStatus[idx];
    if (status === 'answered') return base + "bg-[#544bfa] border-[#544bfa] text-white"; // Blue
    if (status === 'review') return base + "bg-yellow-400 border-yellow-400 text-white"; // Yellow
    if (status === 'skipped') return base + "bg-red-500 border-red-500 text-white"; // Red

    // Default (Unvisited/Unanswered)
    return base + "bg-white border-slate-200 text-slate-500 hover:border-slate-300";
  };


  const handleViolation = () => {
    const newStrikes = strikes + 1; //
    setStrikes(newStrikes); //

    if (newStrikes >= 3) {
      toast.error("FINAL WARNING: Third strike reached. Auto-submitting exam...", {
        duration: 5000,
        icon: '🚫'
      }); //
      submitQuiz(true); // Trigger the auto-submit logic
    } else {
      toast.error(`WARNING: Strike ${newStrikes}/3. Do not leave the exam tab!`, {
        duration: 4000,
        icon: '⚠️'
      }); //
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] no-select p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      <AntiCheat
        onPenalty={(s) => setTimeLeft(prev => Math.max(0, prev - s))}
        onViolation={handleViolation} 
      />

      {/* LEFT SIDE: MAIN QUIZ AREA */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-[#544bfa] text-white p-6 md:p-8 rounded-[32px] shadow-[0_20px_40px_-15px_rgba(84,75,250,0.4)]">
          <div>
            <h2 className="text-2xl font-black">{quiz.title}</h2>
            <p className="opacity-80 font-medium mt-1">{studentData.name} ({studentData.id})</p>
          </div>
          <div className={`text-4xl font-mono font-black ${timeLeft < 60 ? 'text-red-300 animate-pulse' : ''}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>

        {/* Question Container */}
        <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full font-bold text-sm">
              Question {currentIdx + 1} of {quiz.questions.length}
            </span>
          </div>

          <h3 className="text-2xl font-bold mb-8 text-slate-800 leading-relaxed">
            {quiz.questions[currentIdx].text}
          </h3>

          <div className="grid gap-4">
            {quiz.questions[currentIdx].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswerSelect(i)}
                className={`p-5 text-left rounded-2xl border-2 transition-all font-medium ${answers[currentIdx] === i
                    ? 'border-[#544bfa] bg-[#f0f0fe] text-[#544bfa] shadow-sm'
                    : 'bg-white border-slate-200 hover:border-[#544bfa]/30 text-slate-700'
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Controls / Bottom Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            disabled={currentIdx === 0 || isSubmitting}
            onClick={() => setCurrentIdx(p => p - 1)}
            className="px-6 py-3 font-bold text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
          >
            Back
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSkipLeave}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
              title="Leave Question Blank"
            >
              <SkipForward size={18} /> Leave Blank
            </button>

            <button
              onClick={handleMarkReview}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              title="Mark for Recheck"
            >
              <Bookmark size={18} /> Recheck Later
            </button>

            {currentIdx === quiz.questions.length - 1 ? (
              <button
                onClick={() => submitQuiz(false)}
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-xl font-black text-white transition-all flex items-center gap-2 ${isSubmitting ? 'bg-slate-400' : 'bg-[#3aa676] hover:bg-[#2e865f] shadow-md shadow-[#3aa676]/30'}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : 'Finish Exam'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(p => p + 1)}
                disabled={isSubmitting}
                className="bg-[#1e2432] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: QUESTION NAVIGATOR PALETTE */}
      <div className="w-full lg:w-[340px] flex-shrink-0">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm sticky top-6">
          <h3 className="text-xl font-black text-slate-800 mb-6">Question Palette</h3>

          {/* Status Legend */}
          <div className="grid grid-cols-2 gap-3 mb-8 text-sm font-bold text-slate-500">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-[#544bfa]"></div> Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-yellow-400"></div> Recheck</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-red-500"></div> Left Blank</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-white border-2 border-slate-200"></div> Unvisited</div>
          </div>

          {/* Number Grid for Jumping */}
          <div className="grid grid-cols-5 gap-3">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={getBoxClass(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl text-center">
            <p className="text-sm font-bold text-slate-500">Progress</p>
            <p className="text-2xl font-black text-[#544bfa]">
              {Object.values(questionStatus).filter(s => s === 'answered').length} / {quiz.questions.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}