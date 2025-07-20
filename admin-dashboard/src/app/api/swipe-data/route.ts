import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface SwipeData {
  // Basic fields
  timestamp: string;
  user_id: string;
  client_ip?: string;
  
  // Real CSV fields for swipe analysis
  event_count?: number;
  swipe_event_rate?: number;
  is_unusual_swipe_frequency?: boolean;
  time_since_last_swipe?: number;
  session_duration?: number;
  time_of_day?: number;
  inter_swipe_variability?: number;
  
  // Position and movement data from CSV
  start_x?: number;
  start_y?: number;
  end_x?: number;
  end_y?: number;
  delta_x?: number;
  delta_y?: number;
  distance?: number;
  duration?: number;
  direction?: string;
  speed?: number;
  angle?: number;
  start_region?: string;
  end_region?: string;
  region_transition?: string;
  acceleration?: number;
  pointer_type?: string;
  target?: string;
  
  // Dashboard compatible fields (required)
  session_id?: string;
  swipe_direction: string;
  distance_pixels: number;
  duration_ms: number;
  velocity_pixels_per_ms: number;
  pressure_start: number;
  pressure_end: number;
  pressure_variance: number;
  touch_area_start: number;
  touch_area_end: number;
  curve_deviation: number;
  device_type: string;
  screen_orientation: string;
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
      path.join(process.cwd(), '..', 'backend-python', 'swipe_features_data.csv'),
      // Path 2: Same directory as admin-dashboard
      path.join(process.cwd(), 'swipe_features_data.csv'),
      // Path 3: Relative from admin-dashboard  
      path.join(process.cwd(), '..', '..', '..', '..', 'backend-python', 'swipe_features_data.csv'),
      // Path 4: Other possible locations
      path.join(process.cwd(), 'backend-python', 'swipe_features_data.csv'),
      path.join(process.cwd(), 'behavioral_data', 'swipe_gesture_data.csv'),
      path.join(process.cwd(), 'swipe_gesture_data.csv')
    ];
    
    let csvPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        csvPath = possiblePath;
        console.log('Found swipe_features_data.csv at:', csvPath);
        break;
      }
    }
    
    if (!csvPath) {
      console.log('Swipe CSV file not found in any of these paths:', possiblePaths);
      // Generate mock data for demonstration
      const mockData = generateMockSwipeData();
      const filteredData = user_id 
        ? mockData.filter(item => item.user_id === user_id)
        : mockData;
      
      const startIndex = (page - 1) * limit;
      const paginatedData = filteredData.slice(startIndex, startIndex + limit);
      
      const stats = calculateSwipeStats(filteredData);

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

    // Transform raw CSV data to match SwipeData interface
    const records: SwipeData[] = rawRecords.map((record: any, index: number) => {
      // Parse timestamp properly - handle Unix timestamp
      let parsedTimestamp = '2024-01-01T00:00:00.000Z';
      if (record.timestamp) {
        const timestamp = parseFloat(record.timestamp);
        if (!isNaN(timestamp)) {
          // Unix timestamp - convert to ISO string
          parsedTimestamp = new Date(timestamp * 1000).toISOString();
        } else {
          // Try to parse as regular date string
          const dateAttempt = new Date(record.timestamp);
          if (!isNaN(dateAttempt.getTime())) {
            parsedTimestamp = dateAttempt.toISOString();
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
      swipe_event_rate: record.swipe_event_rate ? parseFloat(record.swipe_event_rate) : undefined,
      is_unusual_swipe_frequency: record.is_unusual_swipe_frequency === 'True',
      time_since_last_swipe: record.time_since_last_swipe ? parseFloat(record.time_since_last_swipe) : undefined,
      session_duration: record.session_duration ? parseFloat(record.session_duration) : undefined,
      time_of_day: record.time_of_day ? parseFloat(record.time_of_day) : undefined,
      inter_swipe_variability: record.inter_swipe_variability ? parseFloat(record.inter_swipe_variability) : undefined,
      
      // Position and movement data
      start_x: record.start_x ? parseFloat(record.start_x) : undefined,
      start_y: record.start_y ? parseFloat(record.start_y) : undefined,
      end_x: record.end_x ? parseFloat(record.end_x) : undefined,
      end_y: record.end_y ? parseFloat(record.end_y) : undefined,
      delta_x: record.delta_x ? parseFloat(record.delta_x) : undefined,
      delta_y: record.delta_y ? parseFloat(record.delta_y) : undefined,
      distance: record.distance ? parseFloat(record.distance) : undefined,
      duration: record.duration ? parseFloat(record.duration) : undefined,
      direction: record.direction,
      speed: record.speed ? parseFloat(record.speed) : undefined,
      angle: record.angle ? parseFloat(record.angle) : undefined,
      start_region: record.start_region,
      end_region: record.end_region,
      region_transition: record.region_transition,
      acceleration: record.acceleration ? parseFloat(record.acceleration) : undefined,
      pointer_type: record.pointer_type,
      target: record.target,
      
      // Dashboard compatible fields (transformed from CSV data)
      session_id: `session_${record.user_id}_${Math.floor(parseFloat(record.timestamp || Date.now()))}`,
      swipe_direction: record.direction || 'unknown',
      distance_pixels: parseFloat(record.distance || 0),
      duration_ms: parseFloat(record.duration || 0),
      velocity_pixels_per_ms: parseFloat(record.speed || 0),
      pressure_start: 0.5, // Not available in CSV
      pressure_end: 0.5, // Not available in CSV
      pressure_variance: 0, // Not available in CSV
      touch_area_start: 0, // Not available in CSV
      touch_area_end: 0, // Not available in CSV
      curve_deviation: 0, // Not available in CSV
      device_type: 'unknown',
      screen_orientation: 'portrait'
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
    const stats = calculateSwipeStats(filteredData);

    return NextResponse.json({
      data: paginatedData,
      total: filteredData.length,
      page,
      limit,
      stats
    });

  } catch (error) {
    console.error('Error reading swipe data:', error);
    
    // Fallback to mock data
    const mockData = generateMockSwipeData();
    const stats = calculateSwipeStats(mockData);

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

function calculateSwipeStats(data: SwipeData[]) {
  if (data.length === 0) {
    return {
      total_swipes: 0,
      average_velocity: 0,
      average_distance: 0,
      direction_distribution: {},
      unique_users: 0,
      velocity_range: { min: 0, max: 0 }
    };
  }

  const velocityValues = data.map(d => parseFloat(d.velocity_pixels_per_ms.toString()));
  const distanceValues = data.map(d => parseFloat(d.distance_pixels.toString()));
  const uniqueUsers = [...new Set(data.map(d => d.user_id))];

  // Direction distribution
  const directionCounts: Record<string, number> = {};
  data.forEach(d => {
    directionCounts[d.swipe_direction] = (directionCounts[d.swipe_direction] || 0) + 1;
  });

  // User statistics
  const userStats = uniqueUsers.map(userId => {
    const userSwipes = data.filter(d => d.user_id === userId);
    const avgVelocity = userSwipes.reduce((sum, swipe) => sum + parseFloat(swipe.velocity_pixels_per_ms.toString()), 0) / userSwipes.length;
    const avgDistance = userSwipes.reduce((sum, swipe) => sum + parseFloat(swipe.distance_pixels.toString()), 0) / userSwipes.length;
    
    return {
      user_id: userId,
      swipe_count: userSwipes.length,
      average_velocity: Math.round(avgVelocity * 1000) / 1000,
      average_distance: Math.round(avgDistance),
      last_swipe: userSwipes[userSwipes.length - 1]?.timestamp || ''
    };
  });

  const topSwipersbyCount = userStats
    .sort((a, b) => b.swipe_count - a.swipe_count)
    .slice(0, 10);

  return {
    total_swipes: data.length,
    average_velocity: Math.round((velocityValues.reduce((a, b) => a + b, 0) / velocityValues.length) * 1000) / 1000,
    average_distance: Math.round(distanceValues.reduce((a, b) => a + b, 0) / distanceValues.length),
    velocity_range: {
      min: Math.min(...velocityValues),
      max: Math.max(...velocityValues)
    },
    direction_distribution: directionCounts,
    unique_users: uniqueUsers.length,
    top_swipers: topSwipersbyCount,
    recent_activity: data.slice(0, 10) // Take first 10 since data is already sorted by latest first
  };
}

function generateMockSwipeData(): SwipeData[] {
  const users = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005', 'user_006', 'user_007'];
  const directions = ['up', 'down', 'left', 'right', 'diagonal_up_left', 'diagonal_up_right'];
  const deviceTypes = ['mobile', 'tablet'];
  const orientations = ['portrait', 'landscape'];
  const mockData: SwipeData[] = [];

  // Use deterministic values instead of Math.random() to prevent hydration errors
  for (let i = 0; i < 1000; i++) { // Increased from 150 to 1000
    const userId = users[i % users.length];
    const direction = directions[i % directions.length];
    const startX = (i * 17) % 400;
    const startY = (i * 23) % 800;
    const distance = 50 + ((i * 11) % 300);
    const duration = 100 + ((i * 13) % 700);
    const velocity = distance / duration;
    
    let endX = startX;
    let endY = startY;
    
    // Calculate end position based on direction
    switch (direction) {
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
      case 'diagonal_up_left':
        endX = startX - distance * 0.7;
        endY = startY - distance * 0.7;
        break;
      case 'diagonal_up_right':
        endX = startX + distance * 0.7;
        endY = startY - distance * 0.7;
        break;
    }
    
    // Use deterministic timestamp
    const baseTime = new Date('2024-01-01T00:00:00Z');
    baseTime.setHours(baseTime.getHours() + (i * 3)); // Increment by 3 hours for each record
    
    mockData.push({
      timestamp: baseTime.toISOString().slice(0, 19).replace('T', ' '),
      user_id: userId,
      session_id: `session_${i + 1}`,
      swipe_direction: direction,
      start_x: startX,
      start_y: startY,
      end_x: Math.round(endX),
      end_y: Math.round(endY),
      distance_pixels: distance,
      duration_ms: duration,
      velocity_pixels_per_ms: Math.round(velocity * 1000) / 1000,
      acceleration: -1 + ((i * 7) % 200) / 100, // Deterministic -1 to 1
      pressure_start: 0.3 + ((i * 19) % 50) / 100, // Deterministic 0.3 to 0.8
      pressure_end: 0.3 + ((i * 29) % 50) / 100,
      pressure_variance: ((i * 31) % 20) / 100, // Deterministic 0 to 0.2
      touch_area_start: 20 + ((i * 37) % 50),
      touch_area_end: 20 + ((i * 41) % 50),
      curve_deviation: ((i * 43) % 100) / 10, // Deterministic 0 to 10
      device_type: deviceTypes[i % deviceTypes.length],
      screen_orientation: orientations[i % orientations.length]
    });
  }

  return mockData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
