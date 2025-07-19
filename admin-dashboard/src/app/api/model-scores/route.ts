import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
      path.join(process.cwd(), 'model_scores.csv'), // Local to admin-dashboard
      path.join(process.cwd(), '..', 'backend-python', 'model_scores.csv'),
      path.join(process.cwd(), '..', '..', 'backend-python', 'model_scores.csv'),
      path.join(process.cwd(), 'backend-python', 'model_scores.csv'),
      'D:\\Backend\\the_new_model\\RiverAuth\\backend-python\\model_scores.csv',
      path.join(__dirname, '..', '..', '..', '..', 'backend-python', 'model_scores.csv')
    ];
    
    let csvPath = '';
    let csvExists = false;
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        csvPath = testPath;
        csvExists = true;
        break;
      }
    }
    
    // Check if file exists
    if (!csvExists) {
      return NextResponse.json({ 
        error: 'CSV file not found in any expected location',
        searched_paths: possiblePaths,
        current_dir: process.cwd()
      }, { status: 404 });
    }

    // Read the CSV file
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const record: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        
        // Try to parse as number or boolean
        if (value === 'true' || value === 'True') {
          record[header] = true;
        } else if (value === 'false' || value === 'False') {
          record[header] = false;
        } else if (!isNaN(Number(value)) && value !== '') {
          record[header] = Number(value);
        } else {
          record[header] = value;
        }
      });
      
      return record;
    });

    // Add pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const userFilter = searchParams.get('user_id');
    const modelFilter = searchParams.get('model_type');
    const riskFilter = searchParams.get('risk_level');

    let filteredData = data;

    // Apply filters
    if (userFilter) {
      filteredData = filteredData.filter(item => 
        item.user_id?.toString().toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    if (modelFilter && modelFilter !== 'all') {
      filteredData = filteredData.filter(item => item.model_type === modelFilter);
    }

    if (riskFilter && riskFilter !== 'all') {
      filteredData = filteredData.filter(item => item.risk_level === riskFilter);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      total_records: data.length,
      filtered_records: filteredData.length,
      high_risk_count: filteredData.filter(item => item.risk_level === 'high').length,
      unique_users: new Set(filteredData.map(item => item.user_id)).size,
      avg_anomaly_score: filteredData.length > 0 
        ? filteredData.reduce((sum, item) => sum + (item.anomaly_score || 0), 0) / filteredData.length 
        : 0,
      model_counts: {
        typing: filteredData.filter(item => item.model_type === 'typing').length,
        tap: filteredData.filter(item => item.model_type === 'tap').length,
        swipe: filteredData.filter(item => item.model_type === 'swipe').length,
      }
    };

    return NextResponse.json({
      data: paginatedData,
      stats,
      pagination: {
        page,
        limit,
        total_pages: Math.ceil(filteredData.length / limit),
        has_next: endIndex < filteredData.length,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Error reading CSV file:', error);
    return NextResponse.json({ 
      error: 'Failed to read CSV data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
