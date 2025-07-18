import React, { useState, useMemo, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { IonSpinner, IonToast } from '@ionic/react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

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
  const history = useHistory();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Behavioral tracking setup
  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected } = useWebSocket('ws://localhost:8081');
  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);
  const { typingEvents, onInputChange, recordTypingEvent } = useTypingSpeedTracking(send, isConnected);

  // 🔒 Ensures questions don't change on re-renders
  const selectedQuestions = useMemo(() => {
    return shuffleArray(allQuestions).slice(0, 5);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''));

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      history.push('/login');
    }
  }, [isAuthenticated, history]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = newValue;
    setAnswers(newAnswers);

    // Track typing behavior
    const customEvent = {
      detail: { value: newValue },
    } as CustomEvent<{ value: string }>;
    onInputChange(`security_question_${currentIndex}`)(customEvent);

    // Send behavioral data
    const typingData = {
      type: 'security_question_typing',
      timestamp: Date.now(),
      question_index: currentIndex,
      question: selectedQuestions[currentIndex],
      answer_length: newValue.length,
    };
    send(typingData);
  };

  const handleNext = async () => {
    const currentAnswer = answers[currentIndex].trim();
    
    if (!currentAnswer) {
      setToastMsg('Please provide an answer before continuing');
      setShowToast(true);
      return;
    }

    if (currentIndex < selectedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user || !isAuthenticated) {
      setToastMsg('You must be logged in to save security questions');
      setShowToast(true);
      return;
    }

    // Validate all answers are provided
    const emptyAnswers = answers.filter(answer => !answer.trim());
    if (emptyAnswers.length > 0) {
      setToastMsg('Please answer all security questions');
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare questions and answers for backend
      const questionsData = selectedQuestions.map((question, index) => ({
        question: question,
        answer: answers[index].trim()
      }));

      // Track submission
      const submissionData = {
        type: 'security_questions_submission',
        timestamp: Date.now(),
        user_id: user.id,
        questions_count: questionsData.length,
        completed: true,
      };
      send(submissionData);

      // Save to backend
      await apiService.saveSecurityQuestions(questionsData);

      // Store behavioral data
      try {
        await apiService.storeBehavioralData('security_questions_completed', submissionData);
      } catch (behavioralError) {
        console.warn('Failed to store behavioral data:', behavioralError);
      }

      setToastMsg('Security questions saved successfully! 🎉');
      setShowToast(true);

      // Redirect to dashboard after successful submission
      setTimeout(() => {
        history.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Failed to save security questions:', error);
      setToastMsg('Failed to save security questions. Please try again.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout contentRef={contentRef}>
      <div className="max-w-xl mx-auto p-6 text-center space-y-6 text-black">
        <h2 className="text-2xl font-semibold">Security Questions</h2>
        <p className="text-sm text-gray-600">
          Please answer these security questions. They will be used to verify your identity in the future.
        </p>
        
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
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={handleNext}
          disabled={isLoading || !answers[currentIndex]?.trim()}
          className="w-full h-12 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <IonSpinner name="crescent" />
          ) : (
            currentIndex < selectedQuestions.length - 1 ? 'Next' : 'Submit'
          )}
        </button>
        
        <p className="text-sm text-gray-500">
          Question {currentIndex + 1} of {selectedQuestions.length}
        </p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / selectedQuestions.length) * 100}%` }}
          ></div>
        </div>
        
        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
        />
      </div>
    </Layout>
  );
};

export default OnboardingPage;
