import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import toast from '../utils/toast';
import { generateAIQuiz } from '../gemini';

export default function AIQuizView({ onStart, onBack }) {
    const [subject, setSubject] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!subject) return toast.error("Enter a subject first!");
        setLoading(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("missing-gemini-api-key");
            }
            const questions = await generateAIQuiz(subject, apiKey);

            const aiQuiz = {
                title: `AI: ${subject}`,
                questions,
                duration: 10,
                faculty: "AI Generated",
                teacherUid: "gemini-ai"
            };

            onStart(aiQuiz, { name: "AI Explorer", id: "AI-GEN" });
        } catch (err) {
            toast.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-20 px-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold mb-8 hover:text-[#544bfa]">
                <ArrowLeft size={20} /> Back
            </button>
            <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center border border-[#f0f0fe]">
                <div className="w-20 h-20 bg-[#f0f0fe] text-[#544bfa] rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Sparkles size={40} />
                </div>
                <h2 className="text-3xl font-black mb-2">AI Quiz Generator</h2>
                <p className="text-slate-500 font-medium mb-10">Enter any topic and let Gemini build a custom assessment for you.</p>

                <input
                    className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#544bfa] outline-none font-bold text-center text-xl mb-6"
                    placeholder="e.g. Quantum Physics or React Hooks"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-[#544bfa] text-white py-5 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    {loading ? "Generating Quiz..." : "Generate AI Quiz"}
                </button>
            </div>
        </div>
    );
}