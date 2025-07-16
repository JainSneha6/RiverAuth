import React, { useState, useMemo, useRef, useEffect } from 'react';
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

const securityQuestions = {
  personalHistory: [
    "What is the name of the street where you grew up?",
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is the middle name of your oldest sibling?",
    "What is the name of the elementary school you attended?",
    "What was the make and model of your first car?",
    "What was the name of your childhood best friend?",
    "What is your mother's maiden name?",
    "What was the name of the hospital where you were born?"
  ],
  favorites: [
    "What is your favorite book?",
    "What is your favorite movie?",
    "What is your favorite food?",
    "What is your favorite teacher's name?",
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

const Signup4: React.FC = () => {
  const allQuestions = Object.values(securityQuestions).flat();
  const history = useHistory();
  const { user, isAuthenticated, clearError, error } = useAuth();
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

  // Redirect if not authenticated or not completed step 2
  useEffect(() => {
    console.log('Signup4 mounted - Auth state:', { isAuthenticated, user, signup_step: user?.signup_step, is_complete: user?.is_complete });
    if (!isAuthenticated || !user || user.signup_step < 2 || !user.is_complete) {
      console.log('Signup4 redirecting - missing auth or incomplete previous steps');
      if (!isAuthenticated || !user) {
        //history.push('/signup2');
      } else if (user.signup_step < 1) {
        //history.push('/signup2');
      } else if (user.signup_step < 2 || !user.is_complete) {
        //history.push('/signup3');
      }
    }
  }, [isAuthenticated, user, history]);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Show authentication errors
  useEffect(() => {
    if (error) {
      setToastMsg(error);
      setShowToast(true);
    }
  }, [error]);

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
        signup_step: 'security_questions'
      };
      send(submissionData);

      // Save to backend
      await apiService.saveSecurityQuestions(questionsData);

      // Store behavioral data
      try {
        await apiService.storeBehavioralData('signup_security_questions_completed', submissionData);
      } catch (behavioralError) {
        console.warn('Failed to store behavioral data:', behavioralError);
      }

      setToastMsg('Registration completed successfully! 🎉 You can now log in.');
      setShowToast(true);

      // Redirect to login after successful signup completion
      setTimeout(() => {
        history.push('/login');
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
    <Layout contentRef={contentRef} showTopMenu={false}>
      <div className="bg-white rounded-md shadow-md m-2 min-h-screen w-full p-5 flex flex-col">
        <div className="text-black text-3xl font-bold mb-4">Sign Up</div>
        
        {/* Progress Bar - Step 3 of 3 */}
        <div className="flex flex-row gap-2 mb-10 w-full">
          <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
          <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
          <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
        </div>

        <div className="bg-white flex flex-col gap-6 justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-2">Security Questions</h2>
            <p className="text-sm text-gray-600 mb-6">
              Please answer these security questions. They will be used to verify your identity in the future.
            </p>
          </div>
          
          <div className="bg-gray-100 p-6 rounded-xl shadow-md">
            <p className="text-lg font-medium mb-4 text-black">
              {selectedQuestions[currentIndex]}
            </p>
            <input
              type="text"
              value={answers[currentIndex]}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your answer"
              disabled={isLoading}
              style={{ color: 'black' }}
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
              currentIndex < selectedQuestions.length - 1 ? 'Next' : 'Complete Registration'
            )}
          </button>
          
          <p className="text-sm text-gray-500 text-center">
            Question {currentIndex + 1} of {selectedQuestions.length}
          </p>
          
          {/* Progress bar for questions */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / selectedQuestions.length) * 100}%` }}
            ></div>
          </div>
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

export default Signup4;
