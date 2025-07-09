import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';

type Props = {};

const securityQuestions = {
  personalHistory: [
    "What is the name of the street where you grew up?",
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is the middle name of your oldest sibling?",
    "What is the name of the elementary school you attended?",
    "What was the make and model of your first car?",
    "What was the name of your childhood best friend?",
    "What is your mother’s maiden name?",
    "What was the name of the hospital where you were born?"
  ],
  favorites: [
    "What is your favorite book?",
    "What is your favorite movie?",
    "What is your favorite food?",
    "What is your favorite teacher’s name?",
    "What is your favorite sports team?"
  ],
  experiencesMilestones: [
    "Where did you go on your honeymoon?",
    "What was your first job?",
    "Where did you go on your first vacation?",
    "What is the name of the company of your first job?",
    "What was the first concert you attended?"
  ],
  customComplex: [
    "What is the title of your favorite childhood story?",
    "What was the name of your first stuffed animal?",
    "What was your dream job as a child?",
    "What was your childhood phone number (including area code)?"
  ]
};

// Shuffle helper
const shuffleArray = (array: string[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const OnboardingPage = (props: Props) => {
  const allQuestions = Object.values(securityQuestions).flat();

  // 🔒 Ensures questions don't change on re-renders
  const selectedQuestions = useMemo(() => {
    return shuffleArray(allQuestions).slice(0, 5);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = e.target.value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < selectedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log("Submitted answers:", answers);
      alert("Thanks! Your answers have been submitted.");
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto p-6 text-center space-y-6 text-black">
        <h2 className="text-2xl font-semibold">Security Questions</h2>
        <div className="bg-gray-100 p-6 rounded-xl shadow-md">
          <p className="text-lg font-medium mb-4">
            {selectedQuestions[currentIndex]}
          </p>
          <input
            type="text"
            value={answers[currentIndex]}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your answer"
          />
        </div>
        <button
          onClick={handleNext}
          className="w-full h-10 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          {currentIndex < selectedQuestions.length - 1 ? 'Next' : 'Submit'}
        </button>
        <p className="text-sm text-gray-500">
          Question {currentIndex + 1} of {selectedQuestions.length}
        </p>
      </div>
    </Layout>
  );
};

export default OnboardingPage;
