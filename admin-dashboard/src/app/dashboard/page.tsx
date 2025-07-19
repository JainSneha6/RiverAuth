"use client";

import React from "react";
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

// Dynamic imports for components that use browser-only libraries
const WorldMapWithBubbles = dynamic(() => import("@/components/WorldMapWithBubbles"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading map...</div>
});

const PhoneHeatMap = dynamic(() => import("@/components/PhoneHeatMap"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading heatmap...</div>
});

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const typingData = [
  { name: "Mon", wpm: 45 },
  { name: "Tue", wpm: 52 },
  { name: "Wed", wpm: 50 },
  { name: "Thu", wpm: 60 },
  { name: "Fri", wpm: 58 },
];

const swipeData = [
  { name: "Mon", actions: 100 },
  { name: "Tue", actions: 150 },
  { name: "Wed", actions: 130 },
  { name: "Thu", actions: 170 },
  { name: "Fri", actions: 160 },
];

const logoutData = [
  { name: "Mon", count: 2 },
  { name: "Tue", count: 4 },
  { name: "Wed", count: 1 },
  { name: "Thu", count: 5 },
  { name: "Fri", count: 2 },
];

type Props = {};

const Page = (props: Props) => {
  return (
    <div className="p-5  h-[100dvh] w-screen overflow-auto">
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

      <div className="font-bold my-4 text-3xl">Dashboard</div>

      {/* Behavioral Data Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Typing Speed */}
        <Link href="/behavioral-data/typing" className="transition-transform hover:scale-105">
          <Card className="p-4 cursor-pointer hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                ⌨️ Average Typing Speed
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-black">53 WPM</div>
                <div className="text-green-600 font-medium text-sm mt-1">📈 Up 6%</div>
                <div className="text-xs text-gray-500 mt-2">
                  127 sessions • 15 users
                </div>
              </div>
              <div className="w-24 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={typingData}>
                    <Line type="monotone" dataKey="wpm" stroke="#8884d8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Swipe Gestures */}
        <Link href="/behavioral-data/swipe" className="transition-transform hover:scale-105">
          <Card className="p-4 cursor-pointer hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                👆 Swipe Gestures
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-black">142</div>
                <div className="text-red-600 font-medium text-sm mt-1">📉 Down 4%</div>
                <div className="text-xs text-gray-500 mt-2">
                  Avg velocity: 1.2 px/ms
                </div>
              </div>
              <div className="w-24 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={swipeData}>
                    <Line type="monotone" dataKey="actions" stroke="#82ca9d" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Tap Gestures */}
        <Link href="/behavioral-data/tap" className="transition-transform hover:scale-105">
          <Card className="p-4 cursor-pointer hover:shadow-lg">
            <CardHeader>
              <CardTitle className="mt-3 flex items-center gap-2">
                👇 Tap Gestures
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Click to view details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between h-16">
              <div>
                <div className="text-2xl font-bold text-black">2.8k</div>
                <div className="text-green-600 font-medium text-sm mt-1">� Up 12%</div>
                <div className="text-xs text-gray-500 mt-1">
                  Avg pressure: 0.65 • 8% double taps
                </div>
              </div>
              <div className="w-24 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logoutData}>
                    <Line type="monotone" dataKey="count" stroke="#ff7300" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Maps and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">


        {/* Location Map */}
        <div className="lg:col-span-2">
          <Card className="p-4 h-[400px]">
            <CardHeader>
              <CardTitle className="text-xl">User Location Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <WorldMapWithBubbles />
            </CardContent>
          </Card>
        </div>

        {/* Heatmap */}
        <div className="lg:col-span-1">
          <Card className="p-4 h-[400px]">
            <CardHeader>
              <CardTitle className="text-xl">Screen Activity HeatMap</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex items-center justify-center">
              <PhoneHeatMap />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Model Info */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg">Current Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-5 text-sm space-y-1">
              <li>Model: GPT-4 Vision</li>
              <li>Version: 3.2.7</li>
              <li>Accuracy: 91%</li>
              <li>Deployed: 2025-07-10</li>
            </ul>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm list-disc ml-5 space-y-1">
              <li>User John logged in</li>
              <li>Swipe detected at 2:34PM</li>
              <li>Suspicious logout from Delhi</li>
              <li>Model retrained with July data</li>
            </ul>
            <div className="mt-4">
              <Link 
                href="/model-scores" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                📊 View Detailed Model Scores →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
