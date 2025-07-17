import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
  IonIcon,
  IonNote
} from '@ionic/react';
import { shieldCheckmark, warning, close } from 'ionicons/icons';

interface SecurityChallengeModalProps {
  isOpen: boolean;
  questions: string[];
  retryCount: number;
  isProcessing: boolean;
  onSubmit: (answers: string[]) => Promise<boolean>;
  onDismiss: () => void;
}

const SecurityChallengeModal: React.FC<SecurityChallengeModalProps> = ({
  isOpen,
  questions,
  retryCount,
  isProcessing,
  onSubmit,
  onDismiss
}) => {
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    // Reset answers when modal opens
    if (isOpen) {
      setAnswers(new Array(questions.length).fill(''));
      setCurrentQuestionIndex(0);
    }
  }, [isOpen, questions.length]);

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = answers.some(answer => !answer.trim());
    if (unansweredQuestions) {
      window.alert('Please answer all security questions before submitting.');
      return;
    }
    
    try {
      const success = await onSubmit(answers);
      if (!success) {
        // If submission failed, we don't need to do anything here
        // The error handling is done in the useSecurityMonitor hook
        console.log('Security challenge submission failed');
      }
    } catch (error) {
      console.error('Error submitting security answers:', error);
      window.alert('Error submitting answers. Please try again.');
    }
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const allQuestionsAnswered = answers.every(answer => answer.trim().length > 0);

  return (
    <IonModal isOpen={isOpen} backdropDismiss={false}>
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle className="flex items-center gap-2">
            <IonIcon icon={warning} className="text-xl" />
            Security Verification Required
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <div className="max-w-md mx-auto">
          {/* Alert Message */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <IonIcon icon={warning} className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Unusual activity detected!</strong> Please verify your identity by answering your security questions.
                </p>
                {retryCount > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Failed attempts: {retryCount}/3
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-100 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current Question */}
          {questions.length > 0 && (
            <div className="mb-6">
              <IonItem className="rounded-lg mb-4">
                <IonLabel className="ion-text-wrap">
                  <h2 className="font-medium text-gray-100">
                    {questions[currentQuestionIndex]}
                  </h2>
                </IonLabel>
              </IonItem>
              
              <IonItem>
                <IonInput
                  type="text"
                  placeholder="Enter your answer"
                  value={answers[currentQuestionIndex] || ''}
                  onIonInput={(e) => handleAnswerChange(e.detail.value!)}
                  disabled={isProcessing}
                  className="text-gray-900"
                />
              </IonItem>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-6">
            <IonButton
              fill="outline"
              onClick={handlePrevious}
              disabled={isFirstQuestion || isProcessing}
            >
              Previous
            </IonButton>
            
            <div className="flex gap-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentQuestionIndex
                      ? 'bg-blue-500'
                      : answers[index]?.trim()
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {!isLastQuestion ? (
              <IonButton
                onClick={handleNext}
                disabled={!answers[currentQuestionIndex]?.trim() || isProcessing}
              >
                Next
              </IonButton>
            ) : (
              <IonButton
                color="success"
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <IonSpinner name="crescent" className="mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <IonIcon icon={shieldCheckmark} className="mr-2" />
                    Verify
                  </>
                )}
              </IonButton>
            )}
          </div>

          {/* Dismiss Option */}
          <div className="text-center">
            <IonButton 
              fill="clear" 
              color="medium" 
              onClick={onDismiss}
              disabled={isProcessing}
            >
              <IonIcon icon={close} className="mr-2" />
              Cancel (This will log you out)
            </IonButton>
          </div>

          {/* Security Note */}
          <IonNote className="block text-center text-xs text-gray-500 mt-4">
            This security measure protects your account from unauthorized access.
            Your answers are encrypted and never stored in plain text.
          </IonNote>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default SecurityChallengeModal;
