import numpy as np
from collections import defaultdict
from river.anomaly import HalfSpaceTrees
from scipy.spatial.distance import mahalanobis
import logging

# Behavioral risk thresholds
RISK_THRESHOLDS = {
    "HIGH_RISK": 0.95,    # Force logout (increased to reduce easy logout)
    "MEDIUM_RISK": 0.8,   # Security questions challenge (decreased to ask questions more often)
    "LOW_RISK": 0.3       # Normal operation
}

# Reduced warmup threshold for faster meaningful scores
WARMUP_THRESHOLD = 30
user_warmup_counts = defaultdict(int)
user_sample_counts = defaultdict(int)  # Track total samples per user

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
user_ranges = defaultdict(lambda: defaultdict(lambda: [float('inf'), float('-inf')]))  # Fixed initialization
user_geo_data = defaultdict(list)
user_behavior_history = defaultdict(lambda: defaultdict(list))  # Store behavior history

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
    
    # Return meaningful score even with few samples
    if stats["n"] < 3:
        return 0.1  # Small baseline score for insufficient data
    
    mean = stats["sum"] / stats["n"]
    variance = (stats["sq_sum"] / stats["n"] - mean**2)
    std = max(variance ** 0.5, 1e-6)  # Avoid division by zero
    z = abs(val - mean) / std
    
    # More aggressive scaling for better sensitivity
    score = min(z / 2.0, 1.0)  # Reduced from z/3 to z/2
    
    logging.info(f"Tap stats for user {user_id}: mean={mean:.3f}, std={std:.3f}, z={z:.3f}, score={score:.3f}")
    return score

def update_ranges(user_id, features, group):
    for f, v in features.items():
        if isinstance(v, (int, float)) and not np.isnan(v):
            current_range = user_ranges[(user_id, group)][f]
            # Proper min/max initialization
            if current_range[0] == float('inf'):  # First time
                user_ranges[(user_id, group)][f] = [v, v]
            else:
                user_ranges[(user_id, group)][f][0] = min(current_range[0], v)
                user_ranges[(user_id, group)][f][1] = max(current_range[1], v)

def normalize_user_features(user_id, features, group):
    normalized = {}
    for f, v in features.items():
        if not isinstance(v, (int, float)) or np.isnan(v):
            continue
        min_val, max_val = user_ranges[(user_id, group)][f]
        
        # Handle edge cases better
        if max_val == min_val:
            normalized[f] = 0.5  # Neutral value
        else:
            normalized[f] = (v - min_val) / (max_val - min_val)
            # Clamp to [0,1] range
            normalized[f] = max(0.0, min(1.0, normalized[f]))
    
    return normalized

def river_group_score(user_id, group, features):
    update_ranges(user_id, features, group)
    norm = normalize_user_features(user_id, features, group)
    
    # Skip if no valid features
    if not norm:
        return 0.0
    
    # Store behavior history for additional analysis
    user_behavior_history[user_id][group].append(norm)
    
    # Improved HalfSpaceTrees configuration for better sensitivity
    model = user_models[user_id].setdefault(
        group, 
        HalfSpaceTrees(
            seed=42, 
            n_trees=50,      # Increased from 25
            height=4,        # Increased from 3
            window_size=50   # Increased from 30
        )
    )
    
    score = model.score_one(norm)
    model.learn_one(norm)
    
    # Enhanced scoring with statistical variance
    sample_count = len(user_behavior_history[user_id][group])
    
    if sample_count >= 5:
        # Calculate variance-based anomaly score
        history = user_behavior_history[user_id][group][-20:]  # Last 20 samples
        
        # Compute feature-wise statistics
        feature_scores = []
        for feature in norm.keys():
            values = [h.get(feature, 0.5) for h in history if feature in h]
            if len(values) >= 3:
                mean_val = np.mean(values)
                std_val = np.std(values) + 1e-6
                current_val = norm[feature]
                z_score = abs(current_val - mean_val) / std_val
                feature_scores.append(min(z_score / 2.0, 1.0))
        
        if feature_scores:
            variance_score = np.mean(feature_scores)
            # Combine River score with variance score
            combined_score = max(score, variance_score * 0.7)  # Weight variance score
            
            logging.info(f"User {user_id} {group}: river={score:.3f}, variance={variance_score:.3f}, combined={combined_score:.3f}, samples={sample_count}")
            return combined_score
    
    # For early samples, use a baseline scoring mechanism
    if sample_count < 5:
        baseline_score = min(0.1 + (sample_count * 0.02), 0.3)  # Gradual increase
        logging.info(f"User {user_id} {group}: baseline score={baseline_score:.3f}, samples={sample_count}")
        return baseline_score
    
    logging.info(f"User {user_id} {group}: raw river score={score:.3f}, samples={sample_count}")
    return score

def device_score(features):
    flags = sum([
        1 if features.get("emulator_flag") else 0,
        1 if features.get("os_drift", 0) > 0.2 else 0,
        1 if features.get("env_score", 0) < 0.4 else 0
    ])
    return flags / 3

def inject_test_anomaly(session, anomaly_type="tap_outlier"):
    """
    Inject synthetic anomalies for testing model sensitivity
    """
    if anomaly_type == "tap_outlier":
        # Create extremely unusual tap behavior
        session["avg_user_tap_duration"] = session.get("avg_user_tap_duration", 100) * 5  # 5x normal duration
        session["tap_pressure"] = 0.95  # Unusually high pressure
        session["distance_from_user_mean"] = 500  # Far from normal location
    elif anomaly_type == "swipe_outlier":
        # Create unusual swipe behavior
        session["avg_user_swipe_speed"] = session.get("avg_user_swipe_speed", 1.0) * 10  # 10x faster
        session["avg_user_swipe_distance"] = 1000  # Very long swipe
    elif anomaly_type == "typing_outlier":
        # Create unusual typing behavior
        session["avg_user_typing_wpm"] = session.get("avg_user_typing_wpm", 30) * 3  # 3x faster typing
        session["characters_per_second"] = 20  # Impossibly fast
    
    return session

def get_user_model_status(user_id):
    """
    Get detailed status of user models for debugging
    """
    status = {
        "user_id": user_id,
        "sample_count": user_sample_counts[user_id],
        "warmup_remaining": max(0, WARMUP_THRESHOLD - user_sample_counts[user_id]),
        "models": {}
    }
    
    for group in user_models[user_id]:
        if group == "tap_stats":
            stats = user_models[user_id][group]
            status["models"][group] = {
                "type": "statistical",
                "samples": stats["n"],
                "mean": stats["sum"] / stats["n"] if stats["n"] > 0 else 0,
                "std": ((stats["sq_sum"] / stats["n"] - (stats["sum"] / stats["n"])**2) ** 0.5) if stats["n"] > 1 else 0
            }
        else:
            status["models"][group] = {
                "type": "river_anomaly_detector",
                "samples": len(user_behavior_history[user_id][group])
            }
    
    return status

def process_behavior_grouped(session):
    user_id = session["user_id"]
    user_sample_counts[user_id] += 1
    scores = {}
    
    logging.info(f"Processing behavior for user {user_id}, sample #{user_sample_counts[user_id]}")
    
    # Process all groups even during warmup to build models
    for group, features in feature_groups.items():
        group_data = {f: session[f] for f in features if f in session}
        
        if not group_data:  # Skip if no data for this group
            continue
            
        if group == "geo":
            scores[group] = geo_model_score(user_id, group_data)
        elif group == "tap":
            scores[group] = tap_stat_anomaly_score(user_id, group_data)
        elif group == "device":
            scores[group] = device_score(group_data)
        else:
            scores[group] = river_group_score(user_id, group, group_data)
    
    # Calculate overall score if we have any scores
    if scores:
        overall = sum(scores.values()) / len(scores)
    else:
        overall = 0.0
    
    # Determine status based on sample count rather than just warmup
    if user_sample_counts[user_id] < WARMUP_THRESHOLD:
        status = "warming_up"
        remaining = WARMUP_THRESHOLD - user_sample_counts[user_id]
    elif user_sample_counts[user_id] < 20:
        status = "learning"
        remaining = 20 - user_sample_counts[user_id]
    else:
        status = "ready"
        remaining = 0
    
    logging.info(f"User {user_id} - Status: {status}, Overall Score: {overall:.3f}, Individual Scores: {scores}")
    
    return {
        "status": status,
        "remaining": remaining,
        "overall_score": overall,
        "scores": scores,
        "sample_count": user_sample_counts[user_id]
    }
