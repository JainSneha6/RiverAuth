import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';

interface SecurityAlert {
  type: 'high_risk' | 'medium_risk' | 'low_risk';
  score: number;
  model: string;
  message: string;
  timestamp: number;
}

interface SecurityQuestionChallenge {
  questions: string[];
  isActive: boolean;
  retryCount: number;
}

export const useSecurityMonitor = () => {
  const [currentAlert, setCurrentAlert] = useState<SecurityAlert | null>(null);
  const [securityChallenge, setSecurityChallenge] = useState<SecurityQuestionChallenge>({
    questions: [],
    isActive: false,
    retryCount: 0
  });
  const [isProcessingChallenge, setIsProcessingChallenge] = useState(false);
  
  const { logout, user, forceLogout } = useAuth();
  const history = useHistory();

  // Define risk thresholds (updated to match backend)
  const RISK_THRESHOLDS = {
    HIGH_RISK: 0.95,  // Updated to match backend
    MEDIUM_RISK: 0.8, // Updated to match backend (user manually changed from 0.6 to 0.8)
    LOW_RISK: 0.3
  };

  const handleSecurityAlert = useCallback(async (alert: SecurityAlert) => {
    console.log(`🔐 Security Alert: ${alert.type} - Score: ${alert.score} - Model: ${alert.model}`);
    
    setCurrentAlert(alert);

    if (alert.type === 'high_risk') {
      // Immediate logout for high risk
      await handleHighRiskLogout(alert);
    } else if (alert.type === 'medium_risk') {
      // Challenge with security questions
      await handleMediumRiskChallenge(alert);
    }
    // Low risk - continue normal operation
  }, []);

  const handleHighRiskLogout = async (alert: SecurityAlert) => {
    try {
      console.log('🚨 HIGH RISK DETECTED - Forcing logout');
      
      // Store the reason for logout
      localStorage.setItem('logout_reason', JSON.stringify({
        reason: 'suspicious_activity',
        score: alert.score,
        model: alert.model,
        timestamp: alert.timestamp
      }));

      // Force logout
      await forceLogout(`Suspicious activity detected: ${alert.model} score ${alert.score.toFixed(3)}`);
      
      // Redirect to login with error message
      history.push('/login');
      
      // Show alert message
      window.alert('⚠️ SUSPICIOUS ACTIVITY DETECTED\n\nYour session has been terminated due to unusual behavior patterns. Please log in again to continue.');
      
    } catch (error) {
      console.error('Error during high risk logout:', error);
    }
  };

  const handleMediumRiskChallenge = async (alert: SecurityAlert) => {
    try {
      console.log('⚠️ MEDIUM RISK DETECTED - Initiating security challenge');
      
      // Since we're using WebSocket, we'll rely on the backend to send security questions
      // in the behavioral_alert message itself. This function is now mostly for backward compatibility.
      
      // For now, we'll use default security questions
      const defaultQuestions = [
        "What is the name of your first pet?",
        "What city were you born in?",
        "What is your mother's maiden name?"
      ];
      
      setSecurityChallenge({
        questions: defaultQuestions,
        isActive: true,
        retryCount: 0
      });
      
    } catch (error) {
      console.error('Error initiating security challenge:', error);
      // If can't initiate security challenge, treat as high risk
      await handleHighRiskLogout(alert);
    }
  };

  const submitSecurityAnswers = async (answers: string[]): Promise<boolean> => {
    setIsProcessingChallenge(true);
    
    try {
      console.log('🔐 Submitting security answers to WebSocket server');
      
      // Send answers to WebSocket server
      const websocketData = {
        type: 'security_response',
        user_id: user?.id,
        answers: answers.map((answer, index) => ({
          question_id: index + 1,
          answer: answer
        })),
        timestamp: Date.now()
      };
      
      // We'll use a promise to wait for the WebSocket response
      return new Promise((resolve) => {
        // Store the resolve function to be called when we get the response
        (window as any)._securityResponseResolver = resolve;
        
        // Send the data (this will be handled by the WebSocket hook in TopMenu)
        (window as any)._pendingSecurityData = websocketData;
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if ((window as any)._securityResponseResolver) {
            console.log('� Security response timeout');
            (window as any)._securityResponseResolver(false);
            (window as any)._securityResponseResolver = null;
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Error submitting security answers:', error);
      return false;
    } finally {
      setIsProcessingChallenge(false);
    }
  };

  // Simulate security verification (replace with actual backend call)
  const simulateSecurityVerification = (answers: string[]) => {
    // Mock correct answers for testing
    const correctAnswers = ['buddy', 'delhi', 'sharma'];
    let correctCount = 0;
    
    answers.forEach((answer, index) => {
      if (answer.toLowerCase().trim() === correctAnswers[index]) {
        correctCount++;
      }
    });
    
    return {
      success: correctCount >= 2, // At least 2 out of 3 correct
      correctCount
    };
  };

  const dismissChallenge = () => {
    // User chose to dismiss challenge - clear challenge state first
    console.log('🚪 User dismissed security challenge - logging out');
    
    // Clear the security challenge state immediately
    setSecurityChallenge({
      questions: [],
      isActive: false,
      retryCount: 0
    });
    
    // Clear current alert
    setCurrentAlert(null);
    
    // Then proceed with logout
    handleHighRiskLogout({
      type: 'high_risk',
      score: 1.0,
      model: 'user_dismissed',
      message: 'User dismissed security challenge',
      timestamp: Date.now()
    });
  };

  const processWebSocketMessage = useCallback((message: any) => {
    // Check if this is a behavioral alert message
    if (message.type === 'behavioral_alert' && message.user_id === user?.id) {
      const score = message.score || 0;
      const action = message.action || 'monitor';
      
      console.log(`🔍 Processing behavioral alert: score=${score}, action=${action}, severity=${message.severity}`);
      
      // Handle based on action from backend
      if (action === 'force_logout') {
        // High risk - force logout
        handleSecurityAlert({
          type: 'high_risk',
          score: score,
          model: message.model || 'unknown',
          message: message.message || `Suspicious ${message.model} behavior detected`,
          timestamp: Date.now()
        });
      } else if (action === 'security_challenge') {
        // Medium risk - show security questions
        console.log('🔐 Initiating security challenge from backend');
        
        // Extract security questions from backend message
        const securityQuestions = message.security_questions || [];
        
        if (securityQuestions.length > 0) {
          setSecurityChallenge({
            questions: securityQuestions.map((q: any) => q.question),
            isActive: true,
            retryCount: 0
          });
        } else {
          // Fallback to medium risk alert
          handleSecurityAlert({
            type: 'medium_risk',
            score: score,
            model: message.model || 'unknown',
            message: message.message || `Unusual ${message.model} behavior detected`,
            timestamp: Date.now()
          });
        }
      } else if (action === 'monitor') {
        // Low risk - just show alert indicator
        handleSecurityAlert({
          type: 'low_risk',
          score: score,
          model: message.model || 'unknown',
          message: message.message || `Monitoring ${message.model} behavior`,
          timestamp: Date.now()
        });
      }
    }
    
    // Handle security response results
    if (message.type === 'security_response_result' && message.user_id === user?.id) {
      console.log(`🔐 Security response result: ${message.action}`);
      
      // Call the stored resolver if it exists
      if ((window as any)._securityResponseResolver) {
        (window as any)._securityResponseResolver(message.action === 'continue');
        (window as any)._securityResponseResolver = null;
      }
      
      if (message.action === 'force_logout') {
        // Security challenge failed - force logout
        handleSecurityAlert({
          type: 'high_risk',
          score: 1.0,
          model: 'security_verification',
          message: message.message || 'Security verification failed',
          timestamp: Date.now()
        });
      } else if (message.action === 'continue') {
        // Security challenge passed - clear challenge
        setSecurityChallenge({
          questions: [],
          isActive: false,
          retryCount: 0
        });
        setCurrentAlert(null);
      }
    }
  }, [user?.id, handleSecurityAlert]);

  const clearAlert = () => {
    setCurrentAlert(null);
  };

  return {
    currentAlert,
    securityChallenge,
    isProcessingChallenge,
    handleSecurityAlert,
    submitSecurityAnswers,
    dismissChallenge,
    processWebSocketMessage,
    clearAlert,
    RISK_THRESHOLDS
  };
};
