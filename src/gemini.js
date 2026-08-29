const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function generateAIQuiz(subject, apiKey) {
    const prompt = `Create a 10-question multiple choice quiz about "${subject}". 
    Return ONLY a JSON array of objects with this structure: 
    [{"text": "question", "options": ["a", "b", "c", "d"], "correct": 0}].
    Do not include any markdown or extra text.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorDetail = await response.json();
        console.error("API Error Response:", errorDetail);
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        throw new Error("AI response was blocked or empty.");
    }

    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, ""));
}