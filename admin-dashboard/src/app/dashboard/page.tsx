"use client";

import React from "react";
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

import WorldMapWithBubbles from "@/components/WorldMapWithBubbles";
import PhoneHeatMap from "@/components/PhoneHeatMap";

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

      <div className="font-bold my-2 text-3xl">Dashboard</div>

      <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full w-full">
        {/* Typing Speed */}
        {/* Typing Speed */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="mt-3">Average Typing Speed</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between h-40 mb-5">
            <div>
              <div className="text-4xl font-bold text-black">53 WPM</div>
              <div className="text-green-600 font-medium text-sm mt-1">📈 Up 6%</div>
            </div>
            <div className="w-32 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={typingData}>
                  <Line type="monotone" dataKey="wpm" stroke="#8884d8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Swipe Actions */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="mt-3">Swipe Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between h-40 mb-5">
            <div>
              <div className="text-4xl font-bold text-black">142</div>
              <div className="text-red-600 font-medium text-sm mt-1">📉 Down 4%</div>
            </div>
            <div className="w-32 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={swipeData}>
                  <Line type="monotone" dataKey="actions" stroke="#82ca9d" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Suspicious Logouts */}
        <Card className="p-4 ">
          <CardHeader>
            <CardTitle className="mt-3">Suspicious Logouts</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between h-40 mb-5">
            <div>
              <div className="text-4xl font-bold text-black">2.8</div>
              <div className="text-green-600 font-medium text-sm mt-1">📉 Down 14%</div>
            </div>
            <div className="w-32 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logoutData}>
                  <Line type="monotone" dataKey="count" stroke="#ff7300" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>


        {/* Location Map */}
        <Card className="p-4 col-span-2 row-span-2">
          <CardHeader>
            <CardTitle className="mt-3">User Location Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <WorldMapWithBubbles />
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card className="p-4 col-span-1 row-span-6">
          <CardHeader>
            <CardTitle>Screen Activity HeatMap</CardTitle>
          </CardHeader>
          <CardContent >
            <PhoneHeatMap />
          </CardContent>
        </Card>

        {/* Model Info */}
        <Card className="p-4 col-span-1 row-span-4">
          <CardHeader>
            <CardTitle>Current Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-5 text-sm">
              <li>Model: GPT-4 Vision</li>
              <li>Version: 3.2.7</li>
              <li>Accuracy: 91%</li>
              <li>Deployed: 2025-07-10</li>
            </ul>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 col-span-1 row-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm list-disc ml-5">
              <li>User John logged in</li>
              <li>Swipe detected at 2:34PM</li>
              <li>Suspicious logout from Delhi</li>
              <li>Model retrained with July data</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
