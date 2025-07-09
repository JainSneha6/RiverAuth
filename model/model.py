import numpy as np
from collections import defaultdict
from river.anomaly import HalfSpaceTrees
from scipy.spatial.distance import mahalanobis

WARMUP_THRESHOLD = 30
user_warmup_counts = defaultdict(int)

feature_groups = {
    "typing": [
        "typing_event_rate", "inter_typing_variability", "avg_user_typing_wpm",
        "avg_user_typing_duration", "avg_user_typing_length", "characters_per_second"
    ],
    "tap": [
        "tap_event_rate", "inter_tap_variability", "avg_user_tap_duration",
        "tap_region_entropy", "tap_pressure", "distance_from_user_mean"
    ],
    "swipe": [
        "swipe_event_rate", "inter_swipe_variability", "avg_user_swipe_speed",
        "avg_user_swipe_distance", "distance", "duration", "angle",
        "direction", "swipe_direction_entropy", "swipe_direction_consistency"
    ],
    #"geo": ["geo_lat", "geo_lon"],  # future
    #"device": ["emulator_flag", "os_drift", "env_score"]  # future
}

user_models = defaultdict(dict)
user_ranges = defaultdict(lambda: defaultdict(lambda: [float('inf'), float('-inf')]))
user_geo_data = defaultdict(list)

def geo_model_score(user_id, features):
    if "geo_lat" not in features or "geo_lon" not in features:
        return 0.0
    coord = np.array([features["geo_lat"], features["geo_lon"]])
    user_geo_data[user_id].append(coord)
    if len(user_geo_data[user_id]) < 5:
        return 0.0
    data = np.array(user_geo_data[user_id])
    mean = np.mean(data, axis=0)
    cov = np.cov(data, rowvar=False)
    if np.linalg.det(cov) == 0:
        return 0.0
    dist = mahalanobis(coord, mean, np.linalg.inv(cov))
    return min(dist / 10, 1.0)

def tap_stat_anomaly_score(user_id, features):
    val = features.get("avg_user_tap_duration", 0)
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

def update_ranges(user_id, features, group):
    for f, v in features.items():
        if isinstance(v, (int, float)):
            min_val, max_val = user_ranges[(user_id, group)][f]
            user_ranges[(user_id, group)][f][0] = min(min_val, v)
            user_ranges[(user_id, group)][f][1] = max(max_val, v)


def normalize_user_features(user_id, features, group):
    normalized = {}
    for f, v in features.items():
        if not isinstance(v, (int, float)):
            continue  # Skip strings
        min_val, max_val = user_ranges[(user_id, group)][f]
        normalized[f] = 0.5 if max_val == min_val else (v - min_val) / (max_val - min_val)
    return normalized


def river_group_score(user_id, group, features):
    update_ranges(user_id, features, group)
    norm = normalize_user_features(user_id, features, group)
    model = user_models[user_id].setdefault(group, HalfSpaceTrees(seed=42, n_trees=25, height=3, window_size=30))
    score = model.score_one(norm)
    model.learn_one(norm)
    return score

def device_score(features):
    flags = sum([
        1 if features.get("emulator_flag") else 0,
        1 if features.get("os_drift", 0) > 0.2 else 0,
        1 if features.get("env_score", 0) < 0.4 else 0
    ])
    return flags / 3

def process_behavior_grouped(session):
    user_id = session["user_id"]
    scores = {}

    if user_warmup_counts[user_id] < WARMUP_THRESHOLD:
        user_warmup_counts[user_id] += 1
        for group, features in feature_groups.items():
            group_data = {f: session[f] for f in features if f in session}
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

    for group, features in feature_groups.items():
        group_data = {f: session[f] for f in features if f in session}
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
