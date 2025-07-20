import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Define the correct path to the model_scores.csv file
    const csvPath = path.join(process.cwd(), '..', '..', '..', '..', 'model_scores.csv');
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.log('CSV file not found at:', csvPath);
      // Return mock data as fallback
      return NextResponse.json({
        data: generateMockData(),
        message: 'Using mock data - CSV file not found',
        csvPath,
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
      lastUpdated: new Date().toISOString(),
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
      totalScores: 0,
      averageAnomalyScore: 0,
      riskDistribution: { low: 0, medium: 0, high: 0 },
      modelTypeDistribution: { typing: 0, swipe: 0, tap: 0 },
      actionsTaken: {},
      uniqueUsers: 0,
      recentActivity: []
    };
  }
  
  const stats = {
    totalScores: data.length,
    averageAnomalyScore: 0,
    riskDistribution: { low: 0, medium: 0, high: 0 },
    modelTypeDistribution: { typing: 0, swipe: 0, tap: 0 },
    actionsTaken: {} as Record<string, number>,
    uniqueUsers: new Set(data.map(d => d.user_id)).size,
    recentActivity: data.slice(0, 10)
  };
  
  let totalAnomaly = 0;
  
  data.forEach(record => {
    // Anomaly score average
    totalAnomaly += record.anomaly_score || 0;
    
    // Risk distribution
    const riskLevel = record.risk_level as keyof typeof stats.riskDistribution;
    if (riskLevel && stats.riskDistribution.hasOwnProperty(riskLevel)) {
      stats.riskDistribution[riskLevel]++;
    }
    
    // Model type distribution
    const modelType = record.model_type as keyof typeof stats.modelTypeDistribution;
    if (modelType && stats.modelTypeDistribution.hasOwnProperty(modelType)) {
      stats.modelTypeDistribution[modelType]++;
    }
    
    // Actions taken
    const action = record.action_taken;
    if (action) {
      stats.actionsTaken[action] = (stats.actionsTaken[action] || 0) + 1;
    }
  });
  
  stats.averageAnomalyScore = data.length > 0 ? totalAnomaly / data.length : 0;
  
  return stats;
}

function generateMockData() {
  // Fallback mock data when CSV is not available
  const mockData = [];
  const users = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];
  const modelTypes = ['typing', 'swipe', 'tap'];
  const riskLevels = ['low', 'medium', 'high'];
  const actions = ['none', 'security_challenge', 'block_session', 'require_mfa'];
  
  for (let i = 0; i < 50; i++) {
    const anomalyScore = Math.random();
    const riskLevel = anomalyScore < 0.3 ? 'low' : anomalyScore < 0.7 ? 'medium' : 'high';
    const action = riskLevel === 'high' ? 'security_challenge' : riskLevel === 'medium' ? 'none' : 'none';
    
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 5);
    
    mockData.push({
      timestamp: date.toISOString().slice(0, 19).replace('T', ' '),
      user_id: users[Math.floor(Math.random() * users.length)],
      model_type: modelTypes[Math.floor(Math.random() * modelTypes.length)],
      anomaly_score: parseFloat(anomalyScore.toFixed(4)),
      is_warmup: Math.random() > 0.7,
      samples_count: Math.floor(Math.random() * 100) + 1,
      features_processed: Math.floor(Math.random() * 15) + 5,
      risk_level: riskLevel,
      action_taken: action,
      session_duration: Math.floor(Math.random() * 3000) + 500
    });
  }
  
  return mockData;
}
