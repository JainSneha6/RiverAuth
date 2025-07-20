import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface SwipeData {
  timestamp: string;
  user_id: string;
  session_id: string;
  swipe_direction: string;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  distance_pixels: number;
  duration_ms: number;
  velocity_pixels_per_ms: number;
  acceleration: number;
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
    const limit = parseInt(searchParams.get('limit') || '100');
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
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    }) as SwipeData[];

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
      data: mockData.slice(0, 50),
      total: mockData.length,
      page: 1,
      limit: 50,
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
    recent_activity: data.slice(-10).reverse()
  };
}

function generateMockSwipeData(): SwipeData[] {
  const users = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005', 'user_006', 'user_007'];
  const directions = ['up', 'down', 'left', 'right', 'diagonal_up_left', 'diagonal_up_right'];
  const deviceTypes = ['mobile', 'tablet'];
  const orientations = ['portrait', 'landscape'];
  const mockData: SwipeData[] = [];

  for (let i = 0; i < 150; i++) {
    const userId = users[Math.floor(Math.random() * users.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const startX = Math.floor(Math.random() * 400);
    const startY = Math.floor(Math.random() * 800);
    const distance = Math.floor(Math.random() * 300) + 50;
    const duration = Math.floor(Math.random() * 700) + 100;
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
    
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 24 * 7)); // Last week
    
    mockData.push({
      timestamp: date.toISOString().slice(0, 19).replace('T', ' '),
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
      acceleration: Math.random() * 2 - 1, // -1 to 1
      pressure_start: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
      pressure_end: Math.random() * 0.5 + 0.3,
      pressure_variance: Math.random() * 0.2,
      touch_area_start: Math.floor(Math.random() * 50) + 20,
      touch_area_end: Math.floor(Math.random() * 50) + 20,
      curve_deviation: Math.random() * 10,
      device_type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
      screen_orientation: orientations[Math.floor(Math.random() * orientations.length)]
    });
  }

  return mockData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
