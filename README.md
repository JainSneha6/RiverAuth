# RiverAuth - Behaviour Based Continuous Authentication System

> A real-time, resource-efficient, and privacy-compliant solution for continuous mobile authentication using user behavior signals.

## 🔐 Problem Statement

Traditional authentication methods (passwords, OTPs, biometrics) are **static** and vulnerable to post-login threats like:

- Session hijacking
- Account takeovers
- Fraudulent transactions

### ❗️We Solve This By:
Implementing **Behaviour-Based Authentication (BBA)** that monitors real-time interaction patterns like taps, swipes, typing behavior, and navigation flow to continuously verify user identity — without interrupting user experience.

---

## 🚀 Key Features

- 🔍 Real-time anomaly detection
- 📲 Lightweight mobile-first architecture
- 🔄 Continuous learning via streaming model updates
- 🔒 Privacy-first approach, DPDP Act compliant
- 🧠 Context-aware detection (e.g., travel, stress, new device)

---

## 🛠️ System Components

### 1. Behaviour Capture Engine
Captures a rich set of behavioral data:
- **Geolocation**
- **Swipe gestures**
- **Tap pressure**
- **Typing behavior**
- **Device metadata**

### 2. Real-Time Anomaly Detector
- Detects deviation using:
  - `KMeans + Mahalanobis Distance` for geo-behavior
  - `HalfSpaceTrees` (a variant of Isolation Forest) for gestures and typing
- Drift-aware & unsupervised: no labeled data needed

### 3. Adaptive Access Restriction
- Dynamically adjusts access based on anomaly score:
  - 🟢 Low: Full access
  - 🟡 Medium: Security re-authentication
  - 🔴 High: Immediate logout

### 4. Continuous Model Feedback Loop
- Stream processing with **incremental learning**
- Uses **sliding window** and **concept drift adaptation**

---

## 🔧 Tech Stack

| Component      | Tech                            |
|----------------|----------------------------------|
| Frontend       | Ionic + Capacitor                |
| Backend        | Flask                            |
| ML Engine      | [River ML](https://riverml.xyz/) (Online ML), KMeans, HalfSpaceTrees |
| Database       | Azure Cosmos DB                  |
| Data Processing| Pandas, NumPy, Matplotlib        |

---

## 📊 Data & Features

| Behavior       | Engineered Features                            |
|----------------|--------------------------------------------------|
| Geolocation    | Geo-velocity, IP Drift Rate, Radius of Gyration |
| Swipes         | Kinematics, Direction, Pressure, Rhythm         |
| Tap Pressure   | Static/Dynamic Pressure, Timing                 |
| Typing         | Dwell/Flight Time, Error Rates, Burst Patterns  |
| Device Info    | OS Drift, Emulator Flags, Root Check            |

---

## 🧪 Sample Use Case Scenarios

| Score | Scenario | Outcome |
|-------|----------|---------|
| 🟢 Low | Usual login and behavior | Full access granted |
| 🟡 Medium | Same device, strange gestures | OTP re-auth requested |
| 🔴 High | New location + erratic typing | Immediate logout |

---

## 🧱 System Architecture

> 🔗 [Architecture Diagram](https://drive.google.com/file/d/1f7HSYbqJGk_YecKTU20WP6-Q2Bhn6XGW/view?usp=sharing)

---

## 📚 Research References

1. [User Behaviour-Based Mobile Authentication System](https://www.researchgate.net/publication/333285115_User_Behaviour-Based_Mobile_Authentication_System)
2. [Behaviour-Based User Authentication (EURASIP 2022)](https://rdcu.be/eqKc5)
3. [Behaviour Based Authentication: A New Login Strategy for Smartphones (IEEE)](https://ieeexplore.ieee.org/document/8882897)
4. [Behavioral Authentication for Security and Safety (2024)](https://sands.edpsciences.org/articles/sands/full_html/2024/01/sands20230028/sands20230028.html)

---

## 👥 Team PINDrop

- Sneha Jain  
- Siddhartha Chakrabarty  
- Shruti Sood  
- Suraj Chavan  
- Pratham Gadkari  

---

## 📈 Roadmap

- [ ] Full implementation of BBA engine in Ionic
- [ ] Integration with cloud DB and real-time ML stream
- [ ] UI-based anomaly alerts and access restriction
- [ ] Production-level security & legal compliance

---


