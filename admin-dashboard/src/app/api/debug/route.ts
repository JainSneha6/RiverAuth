import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const currentDir = process.cwd();
    
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
      path.join(currentDir, 'model_scores.csv'),
      path.join(currentDir, '..', 'backend-python', 'model_scores.csv'),
      path.join(currentDir, '..', '..', 'backend-python', 'model_scores.csv'),
      'D:\\Backend\\the_new_model\\RiverAuth\\backend-python\\model_scores.csv',
    ];
    
    const pathStatus = possiblePaths.map(testPath => ({
      path: testPath,
      exists: fs.existsSync(testPath),
      isFile: fs.existsSync(testPath) ? fs.statSync(testPath).isFile() : false
    }));
    
    // List files in current directory
    const currentDirFiles = fs.readdirSync(currentDir).filter(file => 
      file.endsWith('.csv') || file.includes('model')
    );
    
    // Check backend-python directory if it exists
    const backendDir = path.join(currentDir, '..', 'backend-python');
    let backendFiles = [];
    if (fs.existsSync(backendDir)) {
      backendFiles = fs.readdirSync(backendDir).filter(file => 
        file.endsWith('.csv') || file.includes('model')
      );
    }

    return NextResponse.json({
      current_directory: currentDir,
      possible_paths: pathStatus,
      current_dir_csv_files: currentDirFiles,
      backend_dir_exists: fs.existsSync(backendDir),
      backend_dir_csv_files: backendFiles,
      environment: process.env.NODE_ENV,
      platform: process.platform
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
