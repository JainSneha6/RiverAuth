# RiverAuth - Behaviour Based Continuous Authentication System

<img width="1525" height="856" alt="image" src="https://github.com/user-attachments/assets/d84946a0-e8f2-4780-98f1-b2f758817b99" />

> A real-time, resource-efficient, and privacy-compliant solution for continuous mobile authentication using user behavior signals.

## Problem Statement

Traditional authentication methods (passwords, OTPs, biometrics) are **static** and vulnerable to post-login threats like:

- Session hijacking
- Account takeovers
- Fraudulent transactions

### We Solve This By:
Implementing **Behaviour-Based Authentication (BBA)** that monitors real-time interaction patterns like taps, swipes, typing behavior, and navigation flow to continuously verify user identity — without interrupting user experience.

---

## Key Features

- Real-time anomaly detection
- Lightweight mobile-first architecture
- Continuous learning via streaming model updates
- Privacy-first approach, DPDP Act compliant
- Context-aware detection (e.g., travel, new device)

---

## System Components

<img width="1526" height="861" alt="image" src="https://github.com/user-attachments/assets/ff561c67-8174-479c-b400-21aa838278a7" />

### 1. Behaviour Capture Engine
Captures a rich set of behavioral data:
- **Geolocation**
- **Swipe gestures**
- **Tap pressure**
- **Typing behavior**
- **Device metadata**

### 2. Real-Time Anomaly Detector
- Detects deviation after capturing data
- Drift-aware & unsupervised: no labeled data needed

### 3. Adaptive Access Restriction
- Dynamically adjusts access based on anomaly score:
  - Low: Full access
  - Medium: Security re-authentication
  - High: Immediate logout

### 4. Continuous Model Feedback Loop
- Stream processing with **incremental learning**
- Uses **sliding window** and **concept drift adaptation**

---

## Data Capturing

<img width="1521" height="852" alt="image" src="https://github.com/user-attachments/assets/bd849fd5-61e9-4b64-a349-427e1e99ba9c" />

<div align="center">

<table>
  <thead>
    <tr>
      <th>Behavior</th>
      <th>Captured Features</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Geolocation</td>
      <td>Geo-velocity, IP Drift Rate, Radius of Gyration</td>
    </tr>
    <tr>
      <td>Swipes</td>
      <td>Kinematics, Direction, Pressure, Rhythm</td>
    </tr>
    <tr>
      <td>Tap Pressure</td>
      <td>Static/Dynamic Pressure, Timing</td>
    </tr>
    <tr>
      <td>Typing</td>
      <td>Dwell/Flight Time, Error Rates, Burst Patterns</td>
    </tr>
    <tr>
      <td>Device Info</td>
      <td>OS Drift, Emulator Flags, Root Check</td>
    </tr>
  </tbody>
</table>

</div>

---

## Feature Engineering

<img width="1526" height="857" alt="image" src="https://github.com/user-attachments/assets/6759497b-a49b-47c3-9d39-f0dd97c53245" />

<div align="center">

<table>
  <thead>
    <tr>
      <th>Behavior</th>
      <th>Engineered Features</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Geolocation</td>
      <td>Geo-velocity, IP Drift Rate, Distance from Home Base, Radius of Gyration</td>
    </tr>
    <tr>
      <td>Swipes</td>
      <td>Kinematics, Geometry, Temporal, Pressure, Rhythms & Pauses, Angle & Direction</td>
    </tr>
    <tr>
      <td>Tap Pressure</td>
      <td>Static Pressure, Dynamic Pressure, Statistical Features, Temporal Features</td>
    </tr>
    <tr>
      <td>Typing</td>
      <td>Dwell Time, Flight Time, Error & Correction Rates, Typing Rhythms, Burst Patterns, Typing Speed</td>
    </tr>
    <tr>
      <td>Device Info</td>
      <td>Device Consistency, OS Drift, Root/Emulator Flags, App Environment Integrity</td>
    </tr>
  </tbody>
</table>

</div>


---

## ML Models

<img width="1523" height="852" alt="image" src="https://github.com/user-attachments/assets/b73c5879-5071-4e1d-8a18-7848d99a5a3a" />

Detects deviation using:
  - `KMeans + Mahalanobis Distance` for geo-behavior
  - `HalfSpaceTrees` (a variant of Isolation Forest) for gestures and typing

---

## Sample Use Case Scenarios

<img width="1527" height="856" alt="image" src="https://github.com/user-attachments/assets/c4da4421-d5e9-45d4-9735-e2a8a947b6b9" />

<div align="center">

<table>
  <thead>
    <tr>
      <th>Score</th>
      <th>Scenario</th>
      <th>Outcome</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Low</td>
      <td>Usual login and behavior</td>
      <td>Full access granted</td>
    </tr>
    <tr>
      <td>Medium</td>
      <td>Same device, strange gestures</td>
      <td>OTP re-auth requested</td>
    </tr>
    <tr>
      <td>High</td>
      <td>New location + erratic typing</td>
      <td>Immediate logout</td>
    </tr>
  </tbody>
</table>

</div>


---

## Tech Stack

<img width="1528" height="852" alt="image" src="https://github.com/user-attachments/assets/17868331-8706-4244-a3e2-577ae1b93ffd" />

<div align="center">

<table>
  <thead>
    <tr>
      <th>Component</th>
      <th>Tech</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Frontend</td>
      <td>Ionic + Capacitor</td>
    </tr>
    <tr>
      <td>Backend</td>
      <td>Flask</td>
    </tr>
    <tr>
      <td>ML Engine</td>
      <td><a href="https://riverml.xyz/">River ML</a> (Online ML), KMeans, HalfSpaceTrees</td>
    </tr>
    <tr>
      <td>Database</td>
      <td>Azure Cosmos DB</td>
    </tr>
    <tr>
      <td>Data Processing</td>
      <td>Pandas, NumPy, Matplotlib</td>
    </tr>
  </tbody>
</table>

</div>

---

## System Architecture

[Architecture Diagram](https://drive.google.com/file/d/1f7HSYbqJGk_YecKTU20WP6-Q2Bhn6XGW/view?usp=sharing)

---

## Research References

1. [User Behaviour-Based Mobile Authentication System](https://www.researchgate.net/publication/333285115_User_Behaviour-Based_Mobile_Authentication_System)
2. [Behaviour-Based User Authentication (EURASIP 2022)](https://rdcu.be/eqKc5)
3. [Behaviour Based Authentication: A New Login Strategy for Smartphones (IEEE)](https://ieeexplore.ieee.org/document/8882897)
4. [Behavioral Authentication for Security and Safety (2024)](https://sands.edpsciences.org/articles/sands/full_html/2024/01/sands20230028/sands20230028.html)

---

## Team PINDrop

- Sneha Jain  
- Siddhartha Chakrabarty  
- Shruti Sood  
- Suraj Chavan  
- Pratham Gadkari  

---



