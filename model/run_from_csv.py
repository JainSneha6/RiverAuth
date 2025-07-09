import pandas as pd
from models import process_behavior_grouped

# === Load from backend-python/ directory ===
df_tap = pd.read_csv("backend-python/tap_features_data.csv")
df_swipe = pd.read_csv("backend-python/swipe_features_data.csv")
df_typing = pd.read_csv("backend-python/typing_features_data.csv")

# === Drop redundant columns from swipe and typing ===
drop_cols = ["user_id", "timestamp", "client_ip", "event_count", "session_duration", "time_of_day"]
df_swipe_clean = df_swipe.drop(columns=[col for col in drop_cols if col in df_swipe.columns])
df_typing_clean = df_typing.drop(columns=[col for col in drop_cols if col in df_typing.columns])

# === Merge tap + swipe + typing row-wise ===
df = pd.concat([df_tap, df_swipe_clean, df_typing_clean], axis=1)
df = df.loc[:, ~df.columns.duplicated()]  # remove duplicate columns

# === Ensure user_id column exists ===
if "user_id" not in df.columns:
    df["user_id"] = "user1"

# === Process each session ===
for i, row in df.iterrows():
    session = {col: row[col] for col in row.index if not pd.isna(row[col])}
    session["user_id"] = str(session["user_id"])

    # Convert values to float where possible
    for key in session:
        if key != "user_id":
            try:
                session[key] = float(session[key])
            except ValueError:
                continue

    result = process_behavior_grouped(session)

    print(f"Session {i + 1} | User: {session['user_id']} | Status: {result['status']}")
    if result["status"] == "scored":
        print(f"  Anomaly Score: {result['overall_score']:.3f}")
        print(f"  Breakdown: {result['scores']}")
    else:
        print(f"  Remaining warm-up sessions: {result['remaining']}")
