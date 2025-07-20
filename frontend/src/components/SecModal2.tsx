import React, { useState, useEffect } from 'react';

interface SecurityChallengeModalProps {
  isOpen: boolean;
  questions: string[];
  retryCount: number;
  isProcessing: boolean;
  onSubmit: (answers: string[]) => Promise<boolean>;
  onDismiss: () => void;
}

const SecurityChallengeModal2: React.FC<SecurityChallengeModalProps> = ({
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
    const unanswered = answers.some(answer => !answer.trim());
    if (unanswered) {
      window.alert('Please answer all questions.');
      return;
    }

    try {
      const success = await onSubmit(answers);
      if (!success) {
        console.log('Security challenge failed');
      }
    } catch (err) {
      console.error('Submit error:', err);
      window.alert('Submission failed. Try again.');
    }
  };

  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;
  const allAnswered = answers.every(answer => answer.trim().length > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg relative m-4">
        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onDismiss}
          disabled={isProcessing}
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-2">
          Security Verification Required
        </h2>

        <p className="text-sm text-yellow-700 mb-4">
          <strong>Unusual activity detected!</strong> Please verify your identity by answering your security questions.
        </p>

        {retryCount > 0 && (
          <p className="text-xs text-red-600 mb-4">
            Failed attempts: {retryCount}/3
          </p>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {questions[currentQuestionIndex]}
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={answers[currentQuestionIndex]}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mb-4">
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

        {/* Buttons */}
        <div className="flex justify-between mt-4">
          <button
            className="text-sm text-gray-600"
            onClick={handlePrevious}
            disabled={isFirst || isProcessing}
          >
            Previous
          </button>
          {!isLast ? (
            <button
              className="bg-blue-500 text-white !px-4 !py-2 rounded"
              onClick={handleNext}
              disabled={!answers[currentQuestionIndex]?.trim() || isProcessing}
            >
              Next
            </button>
          ) : (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleSubmit}
              disabled={!allAnswered || isProcessing}
            >
              {isProcessing ? 'Verifying...' : 'Verify'}
            </button>
          )}
        </div>

        {/* Cancel Button */}
        <div className="text-center mt-6">
          <button
            className="text-sm text-gray-500 underline"
            onClick={onDismiss}
            disabled={isProcessing}
          >
            Cancel (This will log you out)
          </button>
        </div>

        <p className="text-xs text-center text-gray-400 mt-4">
          Your answers are encrypted and never stored in plain text.
        </p>
      </div>
    </div>
  );
};

export default SecurityChallengeModal2;
