import { IonIcon, IonBadge } from '@ionic/react'
import React, { useEffect } from 'react'
import { menu, logOut, personCircleOutline, checkmarkCircle, shieldCheckmark, warning } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSecurityMonitor } from '../hooks/useSecurityMonitor';
import { useWebSocket } from '../hooks/useWebSocket';
import SecurityChallengeModal from './SecurityChallengeModal';
import banner from '../../public/Banner-nobg.png'
import SecurityChallengeModal2 from './SecModal2';

const TopMenu = () => {
  const history = useHistory();
  const { logout, isAuthenticated, user } = useAuth();
  const {
    currentAlert,
    securityChallenge,
    isProcessingChallenge,
    submitSecurityAnswers,
    dismissChallenge,
    processWebSocketMessage,
    clearAlert
  } = useSecurityMonitor();

  // Get WebSocket connection for security monitoring
  const { lastMessage, send: sendWebSocket } = useWebSocket('ws://localhost:8081');

  // Process incoming WebSocket messages for security alerts
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage);
        processWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, processWebSocketMessage]);

  // Check for pending security data and send it
  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any)._pendingSecurityData) {
        const data = (window as any)._pendingSecurityData;
        console.log('🔐 Sending pending security data to WebSocket server');
        sendWebSocket(data);
        (window as any)._pendingSecurityData = null;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [sendWebSocket]);

  // Enhanced security answer submission with WebSocket
  const handleSecurityAnswerSubmission = async (answers: string[]) => {
    try {
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

      console.log('🔐 Sending security answers to WebSocket server');
      sendWebSocket(websocketData);

      // The response will be handled by processWebSocketMessage
      return true;
    } catch (error) {
      console.error('Error sending security answers:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRiskStatusIndicator = () => {
    if (!currentAlert) return null;

    const getRiskColor = () => {
      if (currentAlert.score >= 0.95) return 'text-red-600 bg-red-100 border-red-300';
      if (currentAlert.score >= 0.8) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      return 'text-green-600 bg-green-100 border-green-300';
    };

    const getRiskIcon = () => {
      if (currentAlert.score >= 0.95) return warning;
      if (currentAlert.score >= 0.8) return warning;
      return shieldCheckmark;
    };

    return (
      <div className={`flex items-center gap-1 border rounded-full px-2 py-1 ${getRiskColor()}`}>
        <IonIcon
          icon={getRiskIcon()}
          className="text-sm animate-pulse"
        />
        <span className="text-xs font-medium">
          Risk: {(currentAlert.score * 100).toFixed(0)}%
        </span>
      </div>
    );
  };

  return (
    <>
      <div className='flex justify-between items-center border-black w-full text-black'>
        <IonIcon
          icon={menu}
          className="text-4xl text-black cursor-pointer"
          onClick={() => (document.querySelector('ion-menu') as any)?.open()}
        />
        <img src={banner} className='h-12 w-auto' />

        {/* Authentication Status Indicator */}
        <div className='flex items-center gap-2'>
          {/* Risk Status Indicator */}
          {getRiskStatusIndicator()}

          {!isAuthenticated ? (
            <div className='flex items-center gap-1 bg-red-100 border border-red-300 rounded-full px-3 py-1'>
              <IonIcon
                icon={personCircleOutline}
                className="text-lg text-red-600"
              />
              <span className='text-sm text-red-600 font-medium'>Not Logged In</span>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1 bg-green-100 border border-green-300 rounded-full px-3 py-1'>
                <IonIcon
                  icon={checkmarkCircle}
                  className="text-lg text-green-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Challenge Modal */}
      <SecurityChallengeModal2
        isOpen={securityChallenge.isActive}
        questions={securityChallenge.questions}
        retryCount={securityChallenge.retryCount}
        isProcessing={isProcessingChallenge}
        onSubmit={submitSecurityAnswers}
        onDismiss={dismissChallenge}
      />
    </>
  )
}

export default TopMenu