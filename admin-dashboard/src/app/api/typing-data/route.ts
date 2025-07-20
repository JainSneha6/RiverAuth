import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface TypingData {
  timestamp: string;
  user_id: string;
  session_id: string;
  words_per_minute: number;
  characters_per_minute: number;
  accuracy_percentage: number;
  word_count: number;
  total_characters: number;
  errors_count: number;
  typing_duration_ms: number;
  average_keystroke_time_ms: number;
  keystroke_variance: number;
  pause_count: number;
  longest_pause_ms: number;
  text_complexity_score: number;
  device_type: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    // Try multiple possible paths for the CSV file
    const possiblePaths = [
      // Path 1: Backend-python directory (most likely) 
      path.join(process.cwd(), '..', 'backend-python', 'typing_features_data.csv'),
      // Path 2: Same directory as admin-dashboard
      path.join(process.cwd(), 'typing_features_data.csv'),
      // Path 3: Relative from admin-dashboard
      path.join(process.cwd(), '..', '..', '..', '..', 'backend-python', 'typing_features_data.csv'),
      // Path 4: Other possible locations
      path.join(process.cwd(), 'backend-python', 'typing_features_data.csv'),
      // Legacy paths
      path.join(process.cwd(), 'behavioral_data', 'typing_speed_data.csv'),
      path.join(process.cwd(), '..', 'behavioral_data', 'typing_speed_data.csv'),
      path.join(process.cwd(), '..', 'model', 'behavioral_data', 'typing_speed_data.csv'),
      path.join(process.cwd(), 'typing_speed_data.csv')
    ];

    let csvPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        csvPath = possiblePath;
        console.log('Found typing CSV at:', csvPath);
        break;
      }
    }

    if (!csvPath) {
      // Generate mock data for demonstration
      const mockData = generateMockTypingData();
      const filteredData = user_id 
        ? mockData.filter(item => item.user_id === user_id)
        : mockData;
      
      const startIndex = (page - 1) * limit;
      const paginatedData = filteredData.slice(startIndex, startIndex + limit);
      
      const stats = calculateTypingStats(filteredData);

      return NextResponse.json({
        data: paginatedData,
        total: filteredData.length,
        page,
        limit,
        stats,
        message: "Using mock data - CSV file not found"
      });
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    }) as TypingData[];

    // Filter by user_id if provided
    let filteredData = records;
    if (user_id) {
      filteredData = records.filter(record => record.user_id === user_id);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(startIndex, startIndex + limit);

    // Calculate statistics
    const stats = calculateTypingStats(filteredData);

    return NextResponse.json({
      data: paginatedData,
      total: filteredData.length,
      page,
      limit,
      stats
    });

  } catch (error) {
    console.error('Error reading typing data:', error);
    
    // Fallback to mock data
    const mockData = generateMockTypingData();
    const stats = calculateTypingStats(mockData);

    return NextResponse.json({
      data: mockData.slice(0, 50),
      total: mockData.length,
      page: 1,
      limit: 50,
      stats,
      message: "Error reading CSV file - using mock data"
    });
  }
}

function calculateTypingStats(data: TypingData[]) {
  if (data.length === 0) {
    return {
      total_sessions: 0,
      average_wpm: 0,
      max_wpm: 0,
      min_wpm: 0,
      average_accuracy: 100,
      unique_users: 0,
      top_performers: []
    };
  }

  const wpmValues = data.map(d => parseFloat(d.words_per_minute.toString()));
  const accuracyValues = data.map(d => parseFloat(d.accuracy_percentage.toString()));
  const uniqueUsers = [...new Set(data.map(d => d.user_id))];

  // Calculate user averages for top performers
  const userStats = uniqueUsers.map(userId => {
    const userSessions = data.filter(d => d.user_id === userId);
    const avgWpm = userSessions.reduce((sum, session) => sum + parseFloat(session.words_per_minute.toString()), 0) / userSessions.length;
    const avgAccuracy = userSessions.reduce((sum, session) => sum + parseFloat(session.accuracy_percentage.toString()), 0) / userSessions.length;
    
    return {
      user_id: userId,
      average_wpm: Math.round(avgWpm * 100) / 100,
      average_accuracy: Math.round(avgAccuracy * 100) / 100,
      session_count: userSessions.length,
      last_session: userSessions[userSessions.length - 1]?.timestamp || ''
    };
  });

  const topPerformers = userStats
    .sort((a, b) => b.average_wpm - a.average_wpm)
    .slice(0, 10);

  return {
    total_sessions: data.length,
    average_wpm: Math.round((wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length) * 100) / 100,
    max_wpm: Math.max(...wpmValues),
    min_wpm: Math.min(...wpmValues),
    average_accuracy: Math.round((accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length) * 100) / 100,
    unique_users: uniqueUsers.length,
    top_performers: topPerformers,
    recent_activity: data.slice(-10).reverse()
  };
}

function generateMockTypingData(): TypingData[] {
  const users = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005', 'user_006', 'user_007'];
  const deviceTypes = ['mobile', 'tablet', 'desktop'];
  const mockData: TypingData[] = [];

  for (let i = 0; i < 100; i++) {
    const userId = users[Math.floor(Math.random() * users.length)];
    const wpm = Math.floor(Math.random() * 50) + 30; // 30-80 WPM
    const accuracy = Math.random() * 15 + 85; // 85-100% accuracy
    
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 24 * 7)); // Last week
    
    mockData.push({
      timestamp: date.toISOString().slice(0, 19).replace('T', ' '),
      user_id: userId,
      session_id: `session_${i + 1}`,
      words_per_minute: wpm,
      characters_per_minute: wpm * 5,
      accuracy_percentage: Math.round(accuracy * 100) / 100,
      word_count: Math.floor(Math.random() * 40) + 10,
      total_characters: Math.floor(Math.random() * 200) + 50,
      errors_count: Math.floor(Math.random() * 5),
      typing_duration_ms: Math.floor(Math.random() * 25000) + 5000,
      average_keystroke_time_ms: Math.floor(Math.random() * 100) + 50,
      keystroke_variance: Math.random() * 20,
      pause_count: Math.floor(Math.random() * 10),
      longest_pause_ms: Math.floor(Math.random() * 2000) + 500,
      text_complexity_score: Math.random() * 3 + 1,
      device_type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)]
    });
  }

  return mockData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
