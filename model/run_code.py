import pandas as pd
from model import process_behavior_grouped

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

# Run anomaly scoring per session
for i, row in df.iterrows():
    session = {col: row[col] for col in row.index if not pd.isna(row[col])}
    session["user_id"] = str(session["user_id"])

    for k in session:
        if k != "user_id":
            try:
                session[k] = float(session[k])
            except:
                continue

    result = process_behavior_grouped(session)

    print(f"Session {i+1} | User: {session['user_id']} | Status: {result['status']}")
    if result["status"] == "scored":
        print(f"  Anomaly Score: {result['overall_score']:.3f}")
        print(f"  Breakdown: {result['scores']}")
    else:
        print(f"  Remaining warm-up sessions: {result['remaining']}")
