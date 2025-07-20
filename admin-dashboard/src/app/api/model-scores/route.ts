import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Define multiple possible paths to find the model_scores.csv file
    const possiblePaths = [
      // Path 1: Root directory (most likely)
      path.join(process.cwd(), '..', 'model_scores.csv'),
      // Path 2: Backend-python directory  
      path.join(process.cwd(), '..', 'backend-python', 'model_scores.csv'),
      // Path 3: Same directory as admin-dashboard
      path.join(process.cwd(), 'model_scores.csv'),
      // Path 4: Relative from admin-dashboard
      path.join(process.cwd(), '..', '..', '..', '..', 'model_scores.csv'),
      // Path 5: Backend-python from different relative paths
      path.join(process.cwd(), '..', '..', '..', '..', 'backend-python', 'model_scores.csv')
    ];
    
    let csvPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        csvPath = possiblePath;
        console.log('Found model_scores.csv at:', csvPath);
        break;
      }
    }
    
    // Check if file exists
    if (!csvPath) {
      console.log('CSV file not found in any of these paths:', possiblePaths);
      // Return mock data as fallback
      return NextResponse.json({
        data: generateMockData(),
        message: 'Using mock data - CSV file not found in any location',
        searchedPaths: possiblePaths,
        total: 50
      });
    }

    // Read the CSV file
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV data
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return NextResponse.json({
        data: generateMockData(),
        message: 'CSV file is empty or has no data rows',
        total: 50
      });
    }
    
    const headers = lines[0].split(',');
    
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const record: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        
        // Convert specific fields to appropriate types
        if (header === 'anomaly_score') {
          record[header] = parseFloat(value) || 0;
        } else if (['samples_count', 'features_processed', 'session_duration'].includes(header)) {
          record[header] = parseInt(value) || 0;
        } else if (header === 'is_warmup') {
          record[header] = value.toLowerCase() === 'true';
        } else {
          record[header] = value;
        }
      });
      
      return record;
    }).filter(record => record.timestamp); // Filter out empty rows
    
    // Sort by timestamp (most recent first)
    data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Get pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Apply pagination
    const paginatedData = data.slice(offset, offset + limit);
    
    // Calculate statistics
    const stats = calculateStatistics(data);
    
    return NextResponse.json({
      data: paginatedData,
      stats,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit)
      },
      lastUpdated: '2024-01-01T00:00:00.000Z',
      source: 'real_csv_data'
    });

  } catch (error) {
    console.error('Error reading model scores:', error);
    
    return NextResponse.json({
      data: generateMockData(),
      error: 'Failed to read CSV file',
      message: 'Using mock data as fallback',
      details: error instanceof Error ? error.message : 'Unknown error',
      source: 'mock_data'
    });
  }
}

function calculateStatistics(data: any[]) {
  if (data.length === 0) {
    return {
      total_records: 0,
      filtered_records: 0,
      high_risk_count: 0,
      unique_users: 0,
      avg_anomaly_score: 0,
      model_counts: { typing: 0, tap: 0, swipe: 0 },
      risk_distribution: { low: 0, medium: 0, high: 0 },
      actions_taken: {},
      recent_activity: []
    };
  }
  
  const stats = {
    total_records: data.length,
    filtered_records: data.length,
    high_risk_count: 0,
    unique_users: new Set(data.map(d => d.user_id)).size,
    avg_anomaly_score: 0,
    model_counts: { typing: 0, tap: 0, swipe: 0 },
    risk_distribution: { low: 0, medium: 0, high: 0 },
    actions_taken: {} as Record<string, number>,
    recent_activity: data.slice(0, 10)
  };
  
  let totalAnomaly = 0;
  
  data.forEach(record => {
    // Anomaly score average
    totalAnomaly += record.anomaly_score || 0;
    
    // Risk distribution and high risk count
    const riskLevel = record.risk_level as keyof typeof stats.risk_distribution;
    if (riskLevel && stats.risk_distribution.hasOwnProperty(riskLevel)) {
      stats.risk_distribution[riskLevel]++;
      if (riskLevel === 'high') {
        stats.high_risk_count++;
      }
    }
    
    // Model type distribution
    const modelType = record.model_type as keyof typeof stats.model_counts;
    if (modelType && stats.model_counts.hasOwnProperty(modelType)) {
      stats.model_counts[modelType]++;
    }
    
    // Actions taken
    const action = record.action_taken;
    if (action) {
      stats.actions_taken[action] = (stats.actions_taken[action] || 0) + 1;
    }
  });
  
  stats.avg_anomaly_score = data.length > 0 ? totalAnomaly / data.length : 0;
  
  return stats;
}

function generateMockData() {
  // Fallback mock data when CSV is not available
  const mockData = [];
  const users = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];
  const modelTypes = ['typing', 'swipe', 'tap'];
  const riskLevels = ['low', 'medium', 'high'];
  const actions = ['none', 'security_challenge', 'block_session', 'require_mfa'];
  
  // Use deterministic values instead of Math.random() to prevent hydration errors
  for (let i = 0; i < 50; i++) {
    const anomalyScore = ((i * 7) % 100) / 100; // Deterministic 0-1 value
    const riskLevel = anomalyScore < 0.3 ? 'low' : anomalyScore < 0.7 ? 'medium' : 'high';
    const action = riskLevel === 'high' ? 'security_challenge' : riskLevel === 'medium' ? 'none' : 'none';
    
    // Use deterministic timestamp
    const baseTime = new Date('2024-01-01T00:00:00Z');
    baseTime.setMinutes(baseTime.getMinutes() + (i * 5)); // Increment by 5 minutes for each record
    
    mockData.push({
      timestamp: baseTime.toISOString().slice(0, 19).replace('T', ' '),
      user_id: users[i % users.length],
      model_type: modelTypes[i % modelTypes.length],
      anomaly_score: parseFloat(anomalyScore.toFixed(4)),
      is_warmup: (i % 10) < 3, // Deterministic boolean
      samples_count: 1 + ((i * 11) % 100),
      features_processed: 5 + ((i * 13) % 15),
      risk_level: riskLevel,
      action_taken: action,
      session_duration: 500 + ((i * 17) % 3000)
    });
  }
  
  return mockData;
}
