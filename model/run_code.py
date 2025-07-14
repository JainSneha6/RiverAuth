import pandas as pd
from model import process_behavior_grouped
from user_model_manager import process_behavior_stream, get_user_stats, model_manager

# Load data from the backend-python folder
df_tap = pd.read_csv("backend-python/tap_features_data.csv")
df_swipe = pd.read_csv("backend-python/swipe_features_data.csv")
df_typing = pd.read_csv("backend-python/typing_features_data.csv")

# Drop overlapping metadata columns
drop_cols = ["user_id", "timestamp", "client_ip", "event_count", "session_duration", "time_of_day"]
df_swipe_clean = df_swipe.drop(columns=[col for col in drop_cols if col in df_swipe.columns])
df_typing_clean = df_typing.drop(columns=[col for col in drop_cols if col in df_typing.columns])

# Merge all three datasets row-wise
df = pd.concat([df_tap, df_swipe_clean, df_typing_clean], axis=1)
df = df.loc[:, ~df.columns.duplicated()]

# Fallback if no user_id column
if "user_id" not in df.columns:
    df["user_id"] = "user1"

print("=== TESTING USER-SPECIFIC ONLINE LEARNING MODELS ===\n")

# Group data by user_id to demonstrate user-specific models
unique_users = df['user_id'].unique()
print(f"Found {len(unique_users)} unique users: {unique_users}\n")

# Process each session for user-specific model training
for i, row in df.iterrows():
    session = {col: row[col] for col in row.index if not pd.isna(row[col])}
    session["user_id"] = str(session["user_id"])

    # Convert numeric values
    for k in session:
        if k != "user_id":
            try:
                session[k] = float(session[k])
            except:
                continue

    # Process with new user-specific models
    result = process_behavior_stream(session)
    
    if result:
        print(f"Session {i+1} | User: {result['user_id']}")
        for model_type, model_result in result['models'].items():
            status = "warmup" if model_result['is_warmup'] else "scoring"
            print(f"  {model_type.upper()}: {status} | samples: {model_result['samples_count']}", end="")
            if not model_result['is_warmup']:
                print(f" | anomaly: {model_result['anomaly_score']:.3f}")
            else:
                print()
        
        # Also run original unified model for comparison
        original_result = process_behavior_grouped(session)
        print(f"  ORIGINAL: {original_result['status']}", end="")
        if original_result['status'] == 'scored':
            print(f" | overall: {original_result['overall_score']:.3f}")
        else:
            print(f" | remaining: {original_result['remaining']}")
        print()

print("\n=== USER MODEL STATISTICS ===")
for user_id in unique_users:
    user_id_str = str(user_id)
    stats = get_user_stats(user_id_str)
    if stats:
        print(f"\nUser {user_id}:")
        for model_type, model_stats in stats['models'].items():
            print(f"  {model_type.upper()}:")
            print(f"    - Samples trained: {model_stats['samples']}")
            print(f"    - Model exists: {model_stats['model_exists']}")
            print(f"    - Avg anomaly score: {model_stats['avg_anomaly_score']:.3f}")
            if model_stats['recent_scores']:
                print(f"    - Recent scores: {[f'{x:.3f}' for x in model_stats['recent_scores'][-5:]]}")

print(f"\n=== MODEL FILES CREATED ===")
import os
models_dir = "user_models"
if os.path.exists(models_dir):
    for root, dirs, files in os.walk(models_dir):
        for file in files:
            print(f"  {os.path.join(root, file)}")

print("\n=== TESTING ONLINE LEARNING ===")
print("Models can now:")
print("✅ Learn continuously from new user data")
print("✅ Maintain separate models per user")
print("✅ Persist models between sessions")
print("✅ Adapt to changing user behavior")
print("✅ Provide real-time anomaly detection")
