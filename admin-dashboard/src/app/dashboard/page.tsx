"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Keyboard,
  Hand,
  MousePointer,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react';

// Dynamic imports for components that use browser-only libraries
const WorldMapWithBubbles = dynamic(() => import("@/components/WorldMapWithBubbles"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading map...</div>,
});

const PhoneHeatMap = dynamic(() => import("@/components/PhoneHeatMap"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading heatmap...</div>,
});

type Props = {};

const Page = (props: Props) => {
  // State for typing data and stats
  const [typingData, setTypingData] = useState([]);
  const [typingStats, setTypingStats] = useState(null);

  // State for tap data and stats
  const [tapData, setTapData] = useState([]);
  const [tapStats, setTapStats] = useState(null);

  // State for swipe data and stats
  const [swipeData, setSwipeData] = useState([]);
  const [swipeStats, setSwipeStats] = useState(null);

  // State for last updated time
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch typing data (last 5 sessions for chart)
      const typingRes = await fetch("/api/typing-data?limit=5");
      const typingJson = await typingRes.json();
      setTypingData(typingJson.data);
      setTypingStats(typingJson.stats);

      // Fetch tap data (last 100 events for processing)
      const tapRes = await fetch("/api/tap-data?limit=100");
      const tapJson = await tapRes.json();
      setTapData(tapJson.data);
      setTapStats(tapJson.stats);

      // Fetch swipe data (last 100 events for processing)
      const swipeRes = await fetch("/api/swipe-data?limit=100");
      const swipeJson = await swipeRes.json();
      setSwipeData(swipeJson.data);
      setSwipeStats(swipeJson.stats);

      // Set last updated time
      setLastUpdated(new Date().toLocaleString());
    };
    fetchData();
  }, []);

  // Process tap and swipe data to get daily counts for charts
  const processDailyData = (data, key) => {
    const dailyCounts = {};
    data.forEach((item) => {
      const date = new Date(item.timestamp).toDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    const dates = Object.keys(dailyCounts).sort();
    const last5Dates = dates.slice(-5);
    return last5Dates.map((date) => ({ name: date.slice(0, 3), [key]: dailyCounts[date] }));
  };

  const tapChartData = processDailyData(tapData, "count");
  const swipeChartData = processDailyData(swipeData, "actions");

  // Prepare typing chart data
  const typingChartData = typingData.map((item, index) => ({
    name: `S${index + 1}`,
    wpm: item.words_per_minute,
  }));

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
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Title and Timestamp */}
      <div className="flex justify-between items-center mb-4">
        <div className="font-bold text-3xl">Dashboard</div>
        <div className="text-sm text-gray-500">Data as of {lastUpdated}</div>
      </div>

      {/* Behavioral Data Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Typing Speed */}
        <Link href="/behavioral-data/typing" className="transition-transform hover:scale-105">
          <Card className="p-4 cursor-pointer hover:shadow-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-blue-500" />
                Average Typing Speed
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-black">
                  {typingStats?.average_wpm || 0} WPM
                </div>
                <div className="flex items-center text-green-600 font-medium text-sm mt-1">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  Up 6%
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {typingStats?.total_sessions || 0} sessions • {typingStats?.unique_users || 0} users
                </div>
              </div>
              <div className="w-24 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={typingChartData}>
                    <Line type="monotone" dataKey="wpm" stroke="#8884d8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Swipe Gestures */}
        <Link href="/behavioral-data/swipe" className="transition-transform hover:scale-105">
          <Card className="p-4 cursor-pointer hover:shadow-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MousePointer className="w-5 h-5 text-green-500" />
                Swipe Gestures
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-black">
                  {swipeStats?.total_swipes || 0}
                </div>
                <div className="flex items-center text-red-600 font-medium text-sm mt-1">
                  <ArrowDown className="w-4 h-4 mr-1" />
                  Down 4%
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Avg velocity: {swipeStats?.average_velocity || 0} px/ms
                </div>
              </div>
              <div className="w-24 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={swipeChartData}>
                    <Line type="monotone" dataKey="actions" stroke="#82ca9d" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Tap Gestures */}
        <Link href="/behavioral-data/tap" className="transition-transform hover:scale-105">
          <Card className="p-4 cursor-pointer hover:shadow-lg shadow-sm">
            <CardHeader>
              <CardTitle className="mt-3 flex items-center gap-2">
                <Hand className="w-5 h-5 text-purple-500" />
                Tap Gestures
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Click to view details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between h-16">
              <div>
                <div className="text-2xl font-bold text-black">
                  {tapStats?.total_taps || 0}
                </div>
                <div className="flex items-center text-green-600 font-medium text-sm mt-1">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  Up 12%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Avg pressure: {tapStats?.average_pressure || 0} • {tapStats?.double_tap_percentage || 0}% double taps
                </div>
              </div>
              <div className="w-24 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tapChartData}>
                    <Line type="monotone" dataKey="count" stroke="#ff7300" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* View Detailed Model Scores Card */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-500" />
              View Detailed Model Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Access comprehensive performance metrics and insights for all models.
            </p>
            <Link
              href="/model-scores"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
            >
              Go to Model Scores →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;