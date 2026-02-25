import React, { useState, useEffect } from 'react';
import { getAssessmentQuestions, submitAssessment } from '../utils/api';

export default function CheckIn() {
    const [type, setType] = useState('wellness');
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    useEffect(() => {
        loadQuestions(type);
    }, [type]);

    const loadQuestions = async (assessmentType) => {
        try {
            const data = await getAssessmentQuestions(assessmentType);
            setQuestions(data.questions || []);
            setAnswers({});
            setResult(null);
        } catch {
            setQuestions([]);
        }
    };

    const handleSubmit = async () => {
        const formatted = Object.entries(answers).map(([qId, answer]) => ({
            question_id: parseInt(qId),
            answer,
        }));
        try {
            const data = await submitAssessment({ assessment_type: type, answers: formatted });
            setResult(data);
        } catch {
            setResult({ interpretation: 'Something went wrong.' });
        }
    };

    return (
        <div className="check-in">
            <div className="type-select">
                {['wellness', 'stress', 'sleep', 'mood'].map((t) => (
                    <button key={t} className={type === t ? 'active' : ''} onClick={() => setType(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            <div className="questions">
                {questions.map((q) => (
                    <div key={q.id} className="question-card">
                        <p>{q.text}</p>
                        <div className="likert">
                            {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                    key={val}
                                    className={answers[q.id] === val ? 'selected' : ''}
                                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {questions.length > 0 && (
                <button className="submit-btn" onClick={handleSubmit}>Submit Assessment</button>
            )}

            {result && (
                <div className="result-card">
                    <h3>Score: {result.score}/{result.max_score}</h3>
                    <p>{result.interpretation}</p>
                </div>
            )}
        </div>
    );
}
