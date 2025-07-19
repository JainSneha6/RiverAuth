#!/usr/bin/env python3
"""
CSV Analysis Script for Model Scores
Provides analysis and visualization of logged model scores
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from datetime import datetime, timedelta
import json
import os

class ModelScoresAnalyzer:
    """
    Analyzer for model scores CSV data
    """
    
    def __init__(self, csv_file_path="model_scores_logs/model_scores.csv"):
        self.csv_file = csv_file_path
        self.df = None
        self.load_data()
    
    def load_data(self):
        """Load CSV data into DataFrame"""
        try:
            if os.path.exists(self.csv_file):
                self.df = pd.read_csv(self.csv_file)
                self.df['datetime'] = pd.to_datetime(self.df['datetime'])
                print(f"✅ Loaded {len(self.df)} records from {self.csv_file}")
            else:
                print(f"❌ CSV file not found: {self.csv_file}")
                return False
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            return False
        return True
    
    def basic_statistics(self):
        """Generate basic statistics about the logged data"""
        if self.df is None:
            return None
        
        print("\n📊 BASIC STATISTICS")
        print("=" * 40)
        
        # Overall stats
        total_records = len(self.df)
        unique_users = self.df['user_id'].nunique()
        unique_models = self.df['model_type'].nunique()
        date_range = self.df['datetime'].max() - self.df['datetime'].min()
        
        print(f"Total Records: {total_records}")
        print(f"Unique Users: {unique_users}")
        print(f"Unique Models: {unique_models}")
        print(f"Date Range: {date_range}")
        
        # Score statistics
        print(f"\n📈 Score Statistics:")
        print(f"Mean Score: {self.df['anomaly_score'].mean():.4f}")
        print(f"Median Score: {self.df['anomaly_score'].median():.4f}")
        print(f"Std Score: {self.df['anomaly_score'].std():.4f}")
        print(f"Min Score: {self.df['anomaly_score'].min():.4f}")
        print(f"Max Score: {self.df['anomaly_score'].max():.4f}")
        
        # Risk level distribution
        risk_counts = self.df['risk_level'].value_counts()
        print(f"\n🚦 Risk Level Distribution:")
        for risk, count in risk_counts.items():
            percentage = (count / total_records) * 100
            print(f"   {risk}: {count} ({percentage:.1f}%)")
        
        # Model type distribution
        model_counts = self.df['model_type'].value_counts()
        print(f"\n🤖 Model Type Distribution:")
        for model, count in model_counts.items():
            percentage = (count / total_records) * 100
            print(f"   {model}: {count} ({percentage:.1f}%)")
        
        return {
            'total_records': total_records,
            'unique_users': unique_users,
            'unique_models': unique_models,
            'date_range': date_range,
            'risk_counts': risk_counts.to_dict(),
            'model_counts': model_counts.to_dict()
        }
    
    def user_analysis(self, user_id=None):
        """Analyze scores for a specific user or all users"""
        if self.df is None:
            return None
        
        if user_id:
            user_data = self.df[self.df['user_id'] == user_id]
            print(f"\n👤 USER ANALYSIS: {user_id}")
            print("=" * 40)
            
            if len(user_data) == 0:
                print(f"No data found for user {user_id}")
                return None
            
            print(f"Total Records: {len(user_data)}")
            print(f"Models Used: {user_data['model_type'].nunique()}")
            print(f"Sessions: {user_data['session_id'].nunique()}")
            print(f"Date Range: {user_data['datetime'].min()} to {user_data['datetime'].max()}")
            
            # Score trends
            print(f"\n📈 Score Trends:")
            for model_type in user_data['model_type'].unique():
                model_data = user_data[user_data['model_type'] == model_type]
                mean_score = model_data['anomaly_score'].mean()
                latest_score = model_data.iloc[-1]['anomaly_score']
                trend = "↗️" if latest_score > mean_score else "↘️" if latest_score < mean_score else "➡️"
                print(f"   {model_type}: {mean_score:.4f} avg, {latest_score:.4f} latest {trend}")
            
            return user_data
        else:
            # All users summary
            print(f"\n👥 ALL USERS SUMMARY")
            print("=" * 40)
            
            user_stats = []
            for uid in self.df['user_id'].unique():
                user_data = self.df[self.df['user_id'] == uid]
                user_stats.append({
                    'user_id': uid,
                    'records': len(user_data),
                    'avg_score': user_data['anomaly_score'].mean(),
                    'max_score': user_data['anomaly_score'].max(),
                    'high_risk_events': len(user_data[user_data['risk_level'] == 'HIGH'])
                })
            
            user_stats_df = pd.DataFrame(user_stats)
            print(user_stats_df.to_string(index=False))
            
            return user_stats_df
    
    def model_performance_analysis(self):
        """Analyze performance of different models"""
        if self.df is None:
            return None
        
        print(f"\n🤖 MODEL PERFORMANCE ANALYSIS")
        print("=" * 40)
        
        for model_type in self.df['model_type'].unique():
            model_data = self.df[self.df['model_type'] == model_type]
            
            print(f"\n📊 {model_type.upper()} Model:")
            print(f"   Total Records: {len(model_data)}")
            print(f"   Unique Users: {model_data['user_id'].nunique()}")
            print(f"   Avg Score: {model_data['anomaly_score'].mean():.4f}")
            print(f"   Score Range: {model_data['anomaly_score'].min():.4f} - {model_data['anomaly_score'].max():.4f}")
            print(f"   High Risk Events: {len(model_data[model_data['risk_level'] == 'HIGH'])}")
            print(f"   Avg Processing Time: {model_data['processing_time_ms'].mean():.2f}ms")
            print(f"   Avg Confidence: {model_data['model_confidence'].mean():.4f}")
            
            # Warmup vs Production
            warmup_data = model_data[model_data['is_warmup'] == True]
            production_data = model_data[model_data['is_warmup'] == False]
            
            print(f"   Warmup Records: {len(warmup_data)} ({len(warmup_data)/len(model_data)*100:.1f}%)")
            print(f"   Production Records: {len(production_data)} ({len(production_data)/len(model_data)*100:.1f}%)")
            
            if len(production_data) > 0:
                print(f"   Production Avg Score: {production_data['anomaly_score'].mean():.4f}")
    
    def time_series_analysis(self, user_id=None, model_type=None):
        """Analyze score trends over time"""
        if self.df is None:
            return None
        
        data = self.df.copy()
        
        if user_id:
            data = data[data['user_id'] == user_id]
        
        if model_type:
            data = data[data['model_type'] == model_type]
        
        if len(data) == 0:
            print("No data found for the specified filters")
            return None
        
        print(f"\n📈 TIME SERIES ANALYSIS")
        if user_id:
            print(f"User: {user_id}")
        if model_type:
            print(f"Model: {model_type}")
        print("=" * 40)
        
        # Group by hour and calculate average scores
        data['hour'] = data['datetime'].dt.floor('H')
        hourly_stats = data.groupby('hour')['anomaly_score'].agg(['mean', 'count', 'max']).reset_index()
        
        print(f"Time Range: {data['datetime'].min()} to {data['datetime'].max()}")
        print(f"Total Hours: {len(hourly_stats)}")
        
        # Find periods of high activity
        high_activity = hourly_stats[hourly_stats['count'] > hourly_stats['count'].quantile(0.8)]
        print(f"High Activity Periods: {len(high_activity)}")
        
        # Find periods of high risk
        high_risk = hourly_stats[hourly_stats['max'] > 0.8]
        print(f"High Risk Periods: {len(high_risk)}")
        
        return hourly_stats
    
    def export_analysis_report(self, output_file="model_analysis_report.txt"):
        """Export comprehensive analysis report"""
        if self.df is None:
            return None
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(output_file, 'w') as f:
            f.write(f"MODEL SCORES ANALYSIS REPORT\n")
            f.write(f"Generated: {timestamp}\n")
            f.write("=" * 50 + "\n\n")
            
            # Basic statistics
            stats = self.basic_statistics()
            
            # User analysis
            user_stats = self.user_analysis()
            
            # Model performance
            self.model_performance_analysis()
            
            # Time series
            self.time_series_analysis()
        
        print(f"✅ Analysis report exported to: {output_file}")
        return output_file
    
    def create_visualizations(self):
        """Create visualizations of the data"""
        if self.df is None:
            return None
        
        try:
            # Set up the plotting style
            plt.style.use('seaborn-v0_8')
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            fig.suptitle('Model Scores Analysis Dashboard', fontsize=16, fontweight='bold')
            
            # 1. Score distribution
            axes[0, 0].hist(self.df['anomaly_score'], bins=50, alpha=0.7, color='skyblue')
            axes[0, 0].axvline(0.3, color='green', linestyle='--', label='Low Risk')
            axes[0, 0].axvline(0.8, color='orange', linestyle='--', label='Medium Risk')
            axes[0, 0].axvline(0.95, color='red', linestyle='--', label='High Risk')
            axes[0, 0].set_title('Score Distribution')
            axes[0, 0].set_xlabel('Anomaly Score')
            axes[0, 0].set_ylabel('Frequency')
            axes[0, 0].legend()
            
            # 2. Risk level pie chart
            risk_counts = self.df['risk_level'].value_counts()
            axes[0, 1].pie(risk_counts.values, labels=risk_counts.index, autopct='%1.1f%%', startangle=90)
            axes[0, 1].set_title('Risk Level Distribution')
            
            # 3. Model type comparison
            model_scores = self.df.groupby('model_type')['anomaly_score'].mean()
            axes[1, 0].bar(model_scores.index, model_scores.values, color=['lightcoral', 'lightblue', 'lightgreen'])
            axes[1, 0].set_title('Average Score by Model Type')
            axes[1, 0].set_xlabel('Model Type')
            axes[1, 0].set_ylabel('Average Anomaly Score')
            
            # 4. Time series
            if len(self.df) > 1:
                self.df_sorted = self.df.sort_values('datetime')
                axes[1, 1].plot(self.df_sorted['datetime'], self.df_sorted['anomaly_score'], alpha=0.6)
                axes[1, 1].set_title('Score Trends Over Time')
                axes[1, 1].set_xlabel('Time')
                axes[1, 1].set_ylabel('Anomaly Score')
                axes[1, 1].tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            
            # Save the plot
            plot_file = "model_scores_dashboard.png"
            plt.savefig(plot_file, dpi=300, bbox_inches='tight')
            print(f"✅ Visualizations saved to: {plot_file}")
            
            # Show the plot
            plt.show()
            
            return plot_file
            
        except Exception as e:
            print(f"❌ Error creating visualizations: {e}")
            return None

def main():
    """Main analysis function"""
    print("📊 Starting Model Scores Analysis")
    print("=" * 40)
    
    # Initialize analyzer
    analyzer = ModelScoresAnalyzer()
    
    if analyzer.df is None:
        print("❌ No data to analyze. Please run the logging system first.")
        return
    
    # Run analyses
    analyzer.basic_statistics()
    analyzer.user_analysis()
    analyzer.model_performance_analysis()
    analyzer.time_series_analysis()
    
    # Export report
    analyzer.export_analysis_report()
    
    # Create visualizations
    analyzer.create_visualizations()
    
    print("\n✅ Analysis completed successfully!")

if __name__ == "__main__":
    main()
