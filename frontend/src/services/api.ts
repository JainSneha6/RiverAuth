/**
 * API Service for handling HTTP requests and session management
 */

export interface SessionData {
  session_id: string;
  token: string;
  expires_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_complete: boolean;
  signup_step: number;
}

export interface LoginResponse {
  message: string;
  user: User;
  session: SessionData;
  requires_completion?: boolean;
  next_step?: number;
}

export interface SignupStep1Response {
  message: string;
  user_id: number;
  username: string;
  next_step: number;
  session: SessionData;
}

export interface SignupStep1Data {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  aadhaar: string;
  pan: string;
  password: string;
  confirmPassword: string;
}

export interface SignupStep2Data {
  address: string;
  city: string;
  state: string;
  pincode: string;
  occupation: string;
  income: string;
  accountType: string;
  agreeTerms: boolean;
}

class ApiService {
  private baseUrl = 'http://localhost:5000'; // Flask backend URL
  private token: string | null = null;
  private sessionData: SessionData | null = null;

  constructor() {
    // Load session from localStorage on initialization
    this.loadSession();
  }

  private loadSession() {
    const sessionStr = localStorage.getItem('session');
    const token = localStorage.getItem('token');
    
    if (sessionStr && token) {
      try {
        this.sessionData = JSON.parse(sessionStr);
        this.token = token;
        
        // Check if session is expired
        const expiresAt = new Date(this.sessionData!.expires_at);
        if (expiresAt <= new Date()) {
          this.clearSession();
        }
      } catch (error) {
        this.clearSession();
      }
    }
  }

  private saveSession(sessionData: SessionData) {
    this.sessionData = sessionData;
    this.token = sessionData.token;
    localStorage.setItem('session', JSON.stringify(sessionData));
    localStorage.setItem('token', sessionData.token);
  }

  private clearSession() {
    this.sessionData = null;
    this.token = null;
    localStorage.removeItem('session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.saveSession(response.session);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  async signupStep1(data: SignupStep1Data): Promise<SignupStep1Response> {
    const response = await this.request<SignupStep1Response>('/signup/step1', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.saveSession(response.session);
    localStorage.setItem('user', JSON.stringify({
      id: response.user_id,
      username: response.username,
      next_step: response.next_step
    }));

    return response;
  }

  async signupStep2(data: SignupStep2Data): Promise<any> {
    const response = await this.request('/signup/step2', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Update user completion status
    const user = this.getCurrentUser();
    if (user) {
      user.is_complete = true;
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearSession();
    }
  }

  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/profile');
  }

  async storeBehavioralData(eventType: string, eventData: any): Promise<void> {
    if (!this.sessionData) return;

    await this.request('/behavioral-data', {
      method: 'POST',
      body: JSON.stringify({
        session_id: this.sessionData.session_id,
        event_type: eventType,
        event_data: eventData,
      }),
    });
  }

  async saveSecurityQuestions(questions: Array<{ question: string; answer: string }>): Promise<void> {
    await this.request('/security-questions', {
      method: 'POST',
      body: JSON.stringify({
        questions: questions,
      }),
    });
  }

  async getSecurityQuestions(): Promise<Array<{ question: string; index: number }>> {
    const response = await this.request<{ questions: Array<{ question: string; index: number }> }>('/security-questions');
    return response.questions;
  }

  async verifySecurityAnswers(answers: string[]): Promise<{ verified: boolean; correct_answers: number; total_questions: number }> {
    return this.request('/verify-security-answers', {
      method: 'POST',
      body: JSON.stringify({
        answers: answers,
      }),
    });
  }

  // Session management
  isAuthenticated(): boolean {
    return this.token !== null && this.sessionData !== null;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  getSessionData(): SessionData | null {
    return this.sessionData;
  }

  // Clear session (for logout)
  clearUserSession(): void {
    this.clearSession();
  }

  // Debug function - can be called from browser console
  debug(): void {
    const user = this.getCurrentUser();
    const session = this.getSessionData();
    console.log('=== River Auth Debug Info ===');
    console.log('User ID:', user?.id);
    console.log('Username:', user?.username);
    console.log('Email:', user?.email);
    console.log('Is Complete:', user?.is_complete);
    console.log('Signup Step:', user?.signup_step);
    console.log('Is Authenticated:', this.isAuthenticated());
    console.log('Session ID:', session?.session_id);
    console.log('Token:', session?.token ? 'Present' : 'Missing');
    console.log('Full User Object:', user);
    console.log('Full Session Object:', session);
    console.log('=============================');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Make it globally accessible for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).riverAuth = apiService;
}

export default apiService;
