import numpy as np
from collections import defaultdict
from river.anomaly import HalfSpaceTrees
from scipy.spatial.distance import mahalanobis

# ---------------------
# Global Config
# ---------------------
WARMUP_THRESHOLD = 30  # Global warm-up threshold per user
user_warmup_counts = defaultdict(int)

# ---------------------
# Feature Groups
# ---------------------
feature_groups = {
    "geo": ["geo_lat", "geo_lon"],
    "swipe": ["swipe_speed", "swipe_angle", "swipe_duration"],
    "tap": ["tap_pressure_mean", "tap_duration_avg"],
    "typing": ["dwell_time_avg", "flight_time_avg", "error_rate"],
    "device": ["emulator_flag", "os_drift", "env_score"]
}

# ---------------------
# Model + Data Storage
# ---------------------
user_models = defaultdict(dict)
user_ranges = defaultdict(lambda: defaultdict(lambda: [float('inf'), float('-inf')]))
user_geo_data = defaultdict(list)

# ---------------------
# Geo Group: Mahalanobis
# ---------------------
def geo_model_score(user_id, features):
    coord = np.array([features["geo_lat"], features["geo_lon"]])
    user_geo_data[user_id].append(coord)

    if len(user_geo_data[user_id]) < 5:
        return 0.0  # warm-up

    data = np.array(user_geo_data[user_id])
    mean = np.mean(data, axis=0)
    cov = np.cov(data, rowvar=False)
    if np.linalg.det(cov) == 0:
        return 0.0  # degenerate

    dist = mahalanobis(coord, mean, np.linalg.inv(cov))
    return min(dist / 10, 1.0)

# ---------------------
# Tap Group: Z-score
# ---------------------
def tap_stat_anomaly_score(user_id, features):
    key = "tap_pressure_mean"
    val = features[key]
    stats = user_models[user_id].setdefault("tap_stats", {"sum": 0, "sq_sum": 0, "n": 0})

    stats["sum"] += val
    stats["sq_sum"] += val**2
    stats["n"] += 1

    if stats["n"] < 5:
        return 0.0

    mean = stats["sum"] / stats["n"]
    std = (stats["sq_sum"] / stats["n"] - mean**2) ** 0.5
    z = abs(val - mean) / (std + 1e-6)
    return min(z / 3, 1.0)

# ---------------------
# Range Update + Normalize
# ---------------------
def update_ranges(user_id, features, group):
    for f, v in features.items():
        min_val, max_val = user_ranges[(user_id, group)][f]
        user_ranges[(user_id, group)][f][0] = min(min_val, v)
        user_ranges[(user_id, group)][f][1] = max(max_val, v)

def normalize_user_features(user_id, features, group):
    normalized = {}
    for f, v in features.items():
        min_val, max_val = user_ranges[(user_id, group)][f]
        if max_val == min_val:
            normalized[f] = 0.5
        else:
            normalized[f] = (v - min_val) / (max_val - min_val)
    return normalized

# ---------------------
# Typing/Swipe: HalfSpaceTrees
# ---------------------
def river_group_score(user_id, group, features):
    update_ranges(user_id, features, group)
    norm = normalize_user_features(user_id, features, group)

    model = user_models[user_id].setdefault(group, HalfSpaceTrees(seed=42, n_trees=25, height=3, window_size=30))
    score = model.score_one(norm)
    model.learn_one(norm)
    return score

# ---------------------
# Device Group: Rule-based
# ---------------------
def device_score(features):
    flags = sum([
        1 if features.get("emulator_flag") else 0,
        1 if features.get("os_drift", 0) > 0.2 else 0,
        1 if features.get("env_score", 0) < 0.4 else 0
    ])
    return flags / 3

# ---------------------
# Main Entry Point
# ---------------------
def process_behavior_grouped(session):
    user_id = session["user_id"]
    scores = {}

    # Step 1: Warming up — train only, no scoring
    if user_warmup_counts[user_id] < WARMUP_THRESHOLD:
        user_warmup_counts[user_id] += 1
        for group, group_features in feature_groups.items():
            group_data = {f: session[f] for f in group_features if f in session}
            if group == "geo":
                geo_model_score(user_id, group_data)
            elif group == "tap":
                tap_stat_anomaly_score(user_id, group_data)
            elif group == "device":
                device_score(group_data)
            else:
                river_group_score(user_id, group, group_data)

        return {
            "status": "warming_up",
            "remaining": WARMUP_THRESHOLD - user_warmup_counts[user_id],
            "overall_score": None,
            "scores": None
        }

    # Step 2: Scoring phase
    for group, group_features in feature_groups.items():
        group_data = {f: session[f] for f in group_features if f in session}

        if group == "geo":
            scores[group] = geo_model_score(user_id, group_data)
        elif group == "tap":
            scores[group] = tap_stat_anomaly_score(user_id, group_data)
        elif group == "device":
            scores[group] = device_score(group_data)
        else:
            scores[group] = river_group_score(user_id, group, group_data)

    overall = sum(scores.values()) / len(scores)
    return {
        "status": "scored",
        "overall_score": overall,
        "scores": scores
    }
