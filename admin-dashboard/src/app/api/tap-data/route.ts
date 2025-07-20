import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface TapData {
  // Basic fields
  timestamp: string;
  user_id: string;
  client_ip?: string;
  
  // Real CSV fields for tap analysis
  event_count?: number;
  tap_event_rate?: number;
  is_unusual_tap_frequency?: boolean;
  time_since_last_tap?: number;
  session_duration?: number;
  time_of_day?: number;
  inter_tap_variability?: number;
  
  // Position and interaction data
  client_x?: number;
  client_y?: number;
  screen_x?: number;
  screen_y?: number;
  page_x?: number;
  page_y?: number;
  duration?: number;
  pointer_type?: string;
  target?: string;
  tap_pressure?: number;
  region?: string;
  
  // Dashboard compatible fields
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
    const limit = parseInt(searchParams.get('limit') || '10000'); // Show all data by default
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
      console.log('Checking path:', possiblePath);
      if (fs.existsSync(possiblePath)) {
        csvPath = possiblePath;
        console.log('Found tap_features_data.csv at:', csvPath);
        break;
      }
    }
    
    console.log('Final csvPath:', csvPath);
    
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
    const rawRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Transform raw CSV data to match TapData interface
    const records: TapData[] = rawRecords.map((record: any, index: number) => {
      // Parse timestamp properly - handle Unix timestamp
      let parsedTimestamp = '2024-01-01T00:00:00.000Z';
      if (record.timestamp) {
        const timestamp = parseFloat(record.timestamp);
        if (!isNaN(timestamp)) {
          // If it's a Unix timestamp (large number), convert it
          if (timestamp > 1000000000) {
            parsedTimestamp = new Date(timestamp * 1000).toISOString();
          } else {
            parsedTimestamp = new Date(timestamp).toISOString();
          }
        }
      }
      
      return {
        // Basic fields
        timestamp: parsedTimestamp,
        user_id: record.user_id || `user_${index + 1}`,
        client_ip: record.client_ip,
      
      // Real CSV fields
      event_count: record.event_count ? parseFloat(record.event_count) : undefined,
      tap_event_rate: record.tap_event_rate ? parseFloat(record.tap_event_rate) : undefined,
      is_unusual_tap_frequency: record.is_unusual_tap_frequency === 'True',
      time_since_last_tap: record.time_since_last_tap ? parseFloat(record.time_since_last_tap) : undefined,
      session_duration: record.session_duration ? parseFloat(record.session_duration) : undefined,
      time_of_day: record.time_of_day ? parseFloat(record.time_of_day) : undefined,
      inter_tap_variability: record.inter_tap_variability ? parseFloat(record.inter_tap_variability) : undefined,
      
      // Position data
      client_x: record.client_x ? parseFloat(record.client_x) : undefined,
      client_y: record.client_y ? parseFloat(record.client_y) : undefined,
      screen_x: record.screen_x ? parseFloat(record.screen_x) : undefined,
      screen_y: record.screen_y ? parseFloat(record.screen_y) : undefined,
      page_x: record.page_x ? parseFloat(record.page_x) : undefined,
      page_y: record.page_y ? parseFloat(record.page_y) : undefined,
      duration: record.duration ? parseFloat(record.duration) : undefined,
      pointer_type: record.pointer_type,
      target: record.target,
      tap_pressure: record.tap_pressure ? parseFloat(record.tap_pressure) : undefined,
      region: record.region,
      
      // Dashboard compatible fields (transformed from CSV data)
      session_id: `session_${record.user_id}_${index}`,
      tap_x: parseFloat(record.client_x || record.page_x || 0),
      tap_y: parseFloat(record.client_y || record.page_y || 0),
      pressure: parseFloat(record.tap_pressure || 0.5),
      touch_area: 0, // Not available in CSV
      duration_ms: parseFloat(record.duration || 0),
      tap_type: record.pointer_type === 'gesture' ? 'gesture' : 'single',
      screen_zone: record.region || 'center',
      distance_from_previous_tap: parseFloat(record.distance_from_user_mean || 0),
      time_since_previous_tap_ms: (parseFloat(record.time_since_last_tap || 0) * 1000),
      tap_sequence_position: parseFloat(record.event_count || 1),
      is_double_tap: record.pointer_type === 'gesture',
      finger_used: 'index', // Default value
      device_type: 'unknown',
      screen_orientation: 'portrait',
      app_context: record.target || 'unknown'
      };
    });

    // Sort by timestamp (latest first)
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
      data: mockData.slice(0, 1000), // Show more data instead of just 50
      total: mockData.length,
      page: 1,
      limit: 1000,
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
    recent_activity: data.slice(0, 10) // Take first 10 since data is already sorted by latest first
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

  // Use deterministic values instead of Math.random() to prevent hydration errors
  for (let i = 0; i < 1000; i++) { // Increased from 200 to 1000
    const userId = users[i % users.length];
    const tapType = tapTypes[i % tapTypes.length];
    const isDoubleTap = tapType === 'double' || (i % 10 === 0);
    
    // Use deterministic timestamp
    const baseTime = new Date('2024-01-01T00:00:00Z');
    baseTime.setHours(baseTime.getHours() + (i * 2)); // Increment by 2 hours for each record
    
    mockData.push({
      timestamp: baseTime.toISOString().slice(0, 19).replace('T', ' '),
      user_id: userId,
      session_id: `session_${Math.floor(i / 5) + 1}`,
      tap_x: (i * 17) % 400, // Deterministic x position
      tap_y: (i * 23) % 800, // Deterministic y position
      pressure: 0.2 + ((i * 7) % 70) / 100, // Deterministic pressure between 0.2-0.9
      touch_area: 20 + ((i * 11) % 80), // Deterministic touch area 20-100
      duration_ms: tapType === 'long_press' 
        ? 500 + ((i * 13) % 500) // 500-1000ms for long press
        : 50 + ((i * 19) % 200), // 50-250ms for normal taps
      tap_type: tapType,
      screen_zone: screenZones[i % screenZones.length],
      distance_from_previous_tap: (i * 29) % 300,
      time_since_previous_tap_ms: 100 + ((i * 31) % 2000),
      tap_sequence_position: (i % 10) + 1,
      is_double_tap: isDoubleTap,
      finger_used: fingers[i % fingers.length],
      device_type: deviceTypes[i % deviceTypes.length],
      screen_orientation: orientations[i % orientations.length],
      app_context: appContexts[i % appContexts.length]
    });
  }

  return mockData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
