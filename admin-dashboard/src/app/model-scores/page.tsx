"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data - In real implementation, this would come from CSV file
const mockModelScores = [
  {
    timestamp: "2025-07-19 10:00:00",
    user_id: "user_1",
    model_type: "typing",
    anomaly_score: 0.15,
    is_warmup: false,
    samples_count: 45,
    features_processed: 8,
    risk_level: "low",
    action_taken: "none",
    session_duration: 1200,
  },
  {
    timestamp: "2025-07-19 10:01:00",
    user_id: "user_1", 
    model_type: "tap",
    anomaly_score: 0.23,
    is_warmup: false,
    samples_count: 32,
    features_processed: 10,
    risk_level: "low",
    action_taken: "none",
    session_duration: 1260,
  },
  {
    timestamp: "2025-07-19 10:02:00",
    user_id: "user_2",
    model_type: "typing",
    anomaly_score: 0.85,
    is_warmup: false,
    samples_count: 28,
    features_processed: 8,
    risk_level: "high",
    action_taken: "security_challenge",
    session_duration: 180,
  },
  {
    timestamp: "2025-07-19 10:03:00",
    user_id: "user_2",
    model_type: "swipe",
    anomaly_score: 0.92,
    is_warmup: false,
    samples_count: 15,
    features_processed: 12,
    risk_level: "high",
    action_taken: "force_logout",
    session_duration: 240,
  },
  {
    timestamp: "2025-07-19 10:04:00",
    user_id: "user_3",
    model_type: "tap",
    anomaly_score: 0.05,
    is_warmup: true,
    samples_count: 8,
    features_processed: 10,
    risk_level: "low",
    action_taken: "none",
    session_duration: 60,
  },
  {
    timestamp: "2025-07-19 10:05:00",
    user_id: "user_1",
    model_type: "swipe",
    anomaly_score: 0.67,
    is_warmup: false,
    samples_count: 22,
    features_processed: 12,
    risk_level: "medium",
    action_taken: "security_challenge",
    session_duration: 1500,
  },
];

// Chart data aggregation
const scoreDistributionData = [
  { range: "0.0-0.2", count: 120, percentage: 40 },
  { range: "0.2-0.4", count: 85, percentage: 28 },
  { range: "0.4-0.6", count: 55, percentage: 18 },
  { range: "0.6-0.8", count: 30, percentage: 10 },
  { range: "0.8-1.0", count: 12, percentage: 4 },
];

const modelPerformanceData = [
  { model: "typing", avg_score: 0.25, accuracy: 94, false_positives: 3 },
  { model: "tap", avg_score: 0.31, accuracy: 89, false_positives: 8 },
  { model: "swipe", avg_score: 0.45, accuracy: 87, false_positives: 12 },
];

const timeSeriesData = [
  { time: "10:00", typing: 0.15, tap: 0.23, swipe: 0.18 },
  { time: "10:15", typing: 0.22, tap: 0.31, swipe: 0.28 },
  { time: "10:30", typing: 0.18, tap: 0.45, swipe: 0.67 },
  { time: "10:45", typing: 0.85, tap: 0.12, swipe: 0.92 },
  { time: "11:00", typing: 0.05, tap: 0.08, swipe: 0.15 },
];

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case "low": return "text-green-600 bg-green-100";
    case "medium": return "text-yellow-600 bg-yellow-100";
    case "high": return "text-red-600 bg-red-100";
    default: return "text-gray-600 bg-gray-100";
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "none": return "text-green-600 bg-green-100";
    case "security_challenge": return "text-yellow-600 bg-yellow-100";
    case "force_logout": return "text-red-600 bg-red-100";
    default: return "text-gray-600 bg-gray-100";
  }
};

const ModelScoresPage = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    total_records: 0,
    filtered_records: 0,
    high_risk_count: 0,
    unique_users: 0,
    avg_anomaly_score: 0,
    model_counts: { typing: 0, tap: 0, swipe: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(searchUser && { user_id: searchUser }),
        ...(filterModel !== "all" && { model_type: filterModel }),
        ...(filterRisk !== "all" && { risk_level: filterRisk }),
      });

      const response = await fetch(`/api/model-scores?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result.data || []);
        setStats(result.stats || stats);
        setError("");
      } else {
        setError(result.error || "Failed to fetch data");
        setData(mockModelScores); // Fallback to mock data
      }
    } catch (err) {
      setError("Failed to connect to API");
      setData(mockModelScores); // Fallback to mock data
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchUser, filterModel, filterRisk, page]);

  if (loading) {
    return (
      <div className="p-5 h-[100dvh] w-screen overflow-auto flex items-center justify-center">
        <div className="text-xl">Loading model scores data...</div>
      </div>
    );
  }

  return (
    <div className="p-5 h-[100dvh] w-screen overflow-auto">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/model-scores">Model Scores</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="font-bold my-4 text-3xl">ML Model Scores Dashboard</div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_records}</div>
            <p className="text-xs text-muted-foreground">
              {error ? "Using mock data" : "From CSV file"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High Risk Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.high_risk_count}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring action
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.unique_users}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently monitored
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Anomaly Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avg_anomaly_score.toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all models
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <span>⚠️</span>
              <span className="font-medium">Note:</span>
              <span>{error} - Displaying mock data for demonstration</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={modelPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="#82ca9d" />
                <Bar dataKey="false_positives" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Series */}
        <Card>
          <CardHeader>
            <CardTitle>Scores Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="typing" stroke="#8884d8" />
                <Line type="monotone" dataKey="tap" stroke="#82ca9d" />
                <Line type="monotone" dataKey="swipe" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search by User ID..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="max-w-xs"
            />
            
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Models</option>
              <option value="typing">Typing</option>
              <option value="tap">Tap</option>
              <option value="swipe">Swipe</option>
            </select>
            
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            
            <Button 
              onClick={() => {
                setSearchUser("");
                setFilterModel("all");
                setFilterRisk("all");
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Scores Data ({data.length} records displayed)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Model Type</TableHead>
                <TableHead>Anomaly Score</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Action Taken</TableHead>
                <TableHead>Samples</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Warmup</TableHead>
                <TableHead>Session Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((score, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">
                    {score.timestamp}
                  </TableCell>
                  <TableCell className="font-medium">
                    {score.user_id}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {score.model_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono font-bold ${
                      score.anomaly_score > 0.8 ? 'text-red-600' :
                      score.anomaly_score > 0.6 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {score.anomaly_score?.toFixed(3) || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(score.risk_level)}`}>
                      {score.risk_level?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(score.action_taken)}`}>
                      {score.action_taken?.replace('_', ' ').toUpperCase() || 'NONE'}
                    </span>
                  </TableCell>
                  <TableCell>{score.samples_count || 0}</TableCell>
                  <TableCell>{score.features_processed || 0}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      score.is_warmup ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {score.is_warmup ? 'WARMUP' : 'ACTIVE'}
                    </span>
                  </TableCell>
                  <TableCell>{score.session_duration || 0}s</TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No data available. {error ? "CSV file not found or API error." : "No records match the current filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelScoresPage;
