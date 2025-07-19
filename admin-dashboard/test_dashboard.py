#!/usr/bin/env python3
"""
Test script to verify CSV data and start the admin dashboard
"""
import os
import sys
import subprocess
import pandas as pd

def check_csv_data():
    """Check if CSV data exists and is valid"""
    csv_files = [
        'model_scores.csv',
        '../backend-python/model_scores.csv',
        '../model_scores.csv'
    ]
    
    for csv_file in csv_files:
        if os.path.exists(csv_file):
            try:
                df = pd.read_csv(csv_file)
                print(f"✅ Found CSV: {csv_file}")
                print(f"📊 Records: {len(df)}")
                print(f"🏷️  Columns: {list(df.columns)}")
                print(f"👥 Users: {df['user_id'].nunique() if 'user_id' in df.columns else 'N/A'}")
                print(f"🤖 Models: {df['model_type'].unique().tolist() if 'model_type' in df.columns else 'N/A'}")
                print(f"⚠️  High Risk: {len(df[df['risk_level'] == 'high']) if 'risk_level' in df.columns else 'N/A'}")
                print("📈 Sample data:")
                print(df.head(3).to_string())
                print()
                return True, csv_file
            except Exception as e:
                print(f"❌ Error reading {csv_file}: {e}")
                continue
    
    return False, None

def start_dashboard():
    """Start the Next.js dashboard"""
    print("🚀 Starting Admin Dashboard...")
    
    # Check if we're in the right directory
    if not os.path.exists('package.json'):
        print("❌ Please run this script from the admin-dashboard directory")
        return False
    
    # Check if node_modules exists
    if not os.path.exists('node_modules'):
        print("📦 Installing dependencies...")
        subprocess.run(['npm', 'install'], check=True)
    
    print("🌐 Starting development server...")
    print("📈 Dashboard will be available at:")
    print("   - Main Dashboard: http://localhost:3000/dashboard")
    print("   - Model Scores:   http://localhost:3000/model-scores")
    print("   - Debug Info:     http://localhost:3000/api/debug")
    print()
    
    # Start the development server
    try:
        subprocess.run(['npm', 'run', 'dev'], check=True)
    except KeyboardInterrupt:
        print("\n👋 Dashboard stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting dashboard: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔍 RiverAuth Admin Dashboard - CSV Data Checker")
    print("=" * 50)
    
    # Check CSV data
    csv_found, csv_path = check_csv_data()
    
    if not csv_found:
        print("❌ No valid CSV data found!")
        print("💡 Generating sample data...")
        
        # Generate sample data
        os.chdir('..')
        subprocess.run([sys.executable, 'generate_sample_csv.py'])
        
        # Copy to admin dashboard
        if os.path.exists('model_scores.csv'):
            subprocess.run(['copy', 'model_scores.csv', 'admin-dashboard\\model_scores.csv'], shell=True)
            os.chdir('admin-dashboard')
            print("✅ Sample data created")
        else:
            print("❌ Failed to generate sample data")
            sys.exit(1)
    else:
        print(f"✅ Using CSV data from: {csv_path}")
    
    print("\n" + "=" * 50)
    
    # Start dashboard
    if '--check-only' not in sys.argv:
        start_dashboard()
    else:
        print("✅ CSV data verification complete")
