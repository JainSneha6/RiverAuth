import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface TapData {
  timestamp: string;
  user_id: string;
  session_id: string;
  tap_x: number;
  tap_y: number;
  pressure: number;
  touch_area: number;
  duration_ms: number;
  tap_type: string;
  screen_zone: string;
  distance_from_previous_tap: number;
  time_since_previous_tap_ms: number;
  tap_sequence_position: number;
  is_double_tap: boolean;
  finger_used: string;
  device_type: string;
  screen_orientation: string;
  app_context: string;
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
      path.join(process.cwd(), '..', 'backend-python', 'tap_features_data.csv'),
      // Path 2: Same directory as admin-dashboard
      path.join(process.cwd(), 'tap_features_data.csv'),
      // Path 3: Relative from admin-dashboard
      path.join(process.cwd(), '..', '..', '..', '..', 'backend-python', 'tap_features_data.csv'),
      // Path 4: Other possible locations
      path.join(process.cwd(), 'backend-python', 'tap_features_data.csv'),
      path.join(process.cwd(), 'behavioral_data', 'tap_gesture_data.csv'),
      path.join(process.cwd(), 'tap_gesture_data.csv')
    ];
    
    let csvPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        csvPath = possiblePath;
        console.log('Found tap_features_data.csv at:', csvPath);
        break;
      }
    }
    
    if (!csvPath) {
      console.log('Tap CSV file not found in any of these paths:', possiblePaths);
      // Generate mock data for demonstration
      const mockData = generateMockTapData();
      const filteredData = user_id 
        ? mockData.filter(item => item.user_id === user_id)
        : mockData;
      
      const startIndex = (page - 1) * limit;
      const paginatedData = filteredData.slice(startIndex, startIndex + limit);
      
      const stats = calculateTapStats(filteredData);

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
    }) as TapData[];

    // Filter by user_id if provided
    let filteredData = records;
    if (user_id) {
      filteredData = records.filter(record => record.user_id === user_id);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(startIndex, startIndex + limit);

    // Calculate statistics
    const stats = calculateTapStats(filteredData);

    return NextResponse.json({
      data: paginatedData,
      total: filteredData.length,
      page,
      limit,
      stats
    });

  } catch (error) {
    console.error('Error reading tap data:', error);
    
    // Fallback to mock data
    const mockData = generateMockTapData();
    const stats = calculateTapStats(mockData);

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

function calculateTapStats(data: TapData[]) {
  if (data.length === 0) {
    return {
      total_taps: 0,
      average_pressure: 0,
      average_duration: 0,
      tap_type_distribution: {},
      screen_zone_distribution: {},
      unique_users: 0,
      double_tap_percentage: 0
    };
  }

  const pressureValues = data.map(d => parseFloat(d.pressure.toString()));
  const durationValues = data.map(d => parseFloat(d.duration_ms.toString()));
  const uniqueUsers = [...new Set(data.map(d => d.user_id))];

  // Tap type distribution
  const tapTypeCounts: Record<string, number> = {};
  data.forEach(d => {
    tapTypeCounts[d.tap_type] = (tapTypeCounts[d.tap_type] || 0) + 1;
  });

  // Screen zone distribution
  const screenZoneCounts: Record<string, number> = {};
  data.forEach(d => {
    screenZoneCounts[d.screen_zone] = (screenZoneCounts[d.screen_zone] || 0) + 1;
  });

  // Double tap percentage
  const doubleTaps = data.filter(d => d.is_double_tap || d.tap_type === 'double').length;
  const doubleTapPercentage = (doubleTaps / data.length) * 100;

  // User statistics
  const userStats = uniqueUsers.map(userId => {
    const userTaps = data.filter(d => d.user_id === userId);
    const avgPressure = userTaps.reduce((sum, tap) => sum + parseFloat(tap.pressure.toString()), 0) / userTaps.length;
    const avgDuration = userTaps.reduce((sum, tap) => sum + parseFloat(tap.duration_ms.toString()), 0) / userTaps.length;
    const userDoubleTaps = userTaps.filter(tap => tap.is_double_tap || tap.tap_type === 'double').length;
    
    return {
      user_id: userId,
      tap_count: userTaps.length,
      average_pressure: Math.round(avgPressure * 1000) / 1000,
      average_duration: Math.round(avgDuration),
      double_tap_count: userDoubleTaps,
      last_tap: userTaps[userTaps.length - 1]?.timestamp || ''
    };
  });

  const topTappersByCount = userStats
    .sort((a, b) => b.tap_count - a.tap_count)
    .slice(0, 10);

  return {
    total_taps: data.length,
    average_pressure: Math.round((pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length) * 1000) / 1000,
    average_duration: Math.round(durationValues.reduce((a, b) => a + b, 0) / durationValues.length),
    pressure_range: {
      min: Math.min(...pressureValues),
      max: Math.max(...pressureValues)
    },
    tap_type_distribution: tapTypeCounts,
    screen_zone_distribution: screenZoneCounts,
    double_tap_percentage: Math.round(doubleTapPercentage * 100) / 100,
    unique_users: uniqueUsers.length,
    top_tappers: topTappersByCount,
    recent_activity: data.slice(-10).reverse()
  };
}

function generateMockTapData(): TapData[] {
  const users = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005', 'user_006', 'user_007'];
  const tapTypes = ['single', 'double', 'long_press', 'force_touch'];
  const screenZones = ['top', 'center', 'bottom', 'left', 'right', 'top_left', 'top_right', 'bottom_left', 'bottom_right'];
  const fingers = ['index', 'thumb', 'middle', 'ring'];
  const deviceTypes = ['mobile', 'tablet'];
  const orientations = ['portrait', 'landscape'];
  const appContexts = ['login', 'navigation', 'typing', 'gaming', 'scrolling'];
  const mockData: TapData[] = [];

  for (let i = 0; i < 200; i++) {
    const userId = users[Math.floor(Math.random() * users.length)];
    const tapType = tapTypes[Math.floor(Math.random() * tapTypes.length)];
    const isDoubleTap = tapType === 'double' || Math.random() < 0.1;
    
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 24 * 7)); // Last week
    
    mockData.push({
      timestamp: date.toISOString().slice(0, 19).replace('T', ' '),
      user_id: userId,
      session_id: `session_${Math.floor(i / 5) + 1}`, // Group taps into sessions
      tap_x: Math.floor(Math.random() * 400),
      tap_y: Math.floor(Math.random() * 800),
      pressure: Math.random() * 0.7 + 0.2, // 0.2 to 0.9
      touch_area: Math.floor(Math.random() * 80) + 20, // 20 to 100
      duration_ms: tapType === 'long_press' 
        ? Math.floor(Math.random() * 500) + 500 // 500-1000ms for long press
        : Math.floor(Math.random() * 200) + 50, // 50-250ms for normal taps
      tap_type: tapType,
      screen_zone: screenZones[Math.floor(Math.random() * screenZones.length)],
      distance_from_previous_tap: Math.floor(Math.random() * 300),
      time_since_previous_tap_ms: Math.floor(Math.random() * 2000) + 100,
      tap_sequence_position: (i % 10) + 1, // Position in sequence of 10
      is_double_tap: isDoubleTap,
      finger_used: fingers[Math.floor(Math.random() * fingers.length)],
      device_type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
      screen_orientation: orientations[Math.floor(Math.random() * orientations.length)],
      app_context: appContexts[Math.floor(Math.random() * appContexts.length)]
    });
  }

  return mockData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
