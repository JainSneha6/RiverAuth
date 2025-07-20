'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Keyboard, TrendingUp, Users, Clock, Target, RefreshCw } from 'lucide-react';

interface TypingData {
  timestamp: string;
  user_id: string;
  session_id: string;
  words_per_minute: number;
  characters_per_minute: number;
  accuracy_percentage: number;
  word_count: number;
  total_characters: number;
  errors_count: number;
  typing_duration_ms: number;
  average_keystroke_time_ms: number;
  keystroke_variance: number;
  pause_count: number;
  longest_pause_ms: number;
  text_complexity_score: number;
  device_type: string;
}

interface TypingStats {
  total_sessions: number;
  average_wpm: number;
  max_wpm: number;
  min_wpm: number;
  average_accuracy: number;
  unique_users: number;
  top_performers: Array<{
    user_id: string;
    average_wpm: number;
    average_accuracy: number;
    session_count: number;
    last_session: string;
  }>;
  recent_activity: TypingData[];
}

export default function TypingDataPage() {
  const [data, setData] = useState<TypingData[]>([]);
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchUser, setSearchUser] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async (userId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '10000', // Show all data
        ...(userId && { user_id: userId })
      });

      const response = await fetch(`/api/typing-data?${params}`);
      const result = await response.json();

      if (result.data) {
        setData(result.data);
        setStats(result.stats);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching typing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchData(selectedUser);
      }, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedUser, autoRefresh]);

  const handleUserSearch = () => {
    setSelectedUser(searchUser);
    fetchData(searchUser || undefined);
  };

  const clearUserFilter = () => {
    setSelectedUser('');
    setSearchUser('');
    fetchData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Prepare chart data
  const chartData = data.slice(-20).map((item, index) => ({
    session: `S${index + 1}`,
    wpm: item.words_per_minute,
    accuracy: item.accuracy_percentage,
    errors: item.errors_count,
    timestamp: new Date(item.timestamp).toLocaleTimeString()
  }));

  const deviceDistribution = data.reduce((acc, item) => {
    acc[item.device_type] = (acc[item.device_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceChartData = Object.entries(deviceDistribution).map(([device, count]) => ({
    device,
    count,
    percentage: Math.round((count / data.length) * 100)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-5 h-[100dvh] w-screen overflow-auto">
      <Breadcrumb className="mb-4">
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
              <Link href="/behavioral-data/typing">Typing Data</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold">Typing Speed Analysis</h1>
          </div>
          
          {selectedUser && (
            <Badge variant="secondary" className="text-sm">
              Filtered by: {selectedUser}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Last updated: {lastUpdated || 'Never'}
          </span>
          
          <Button
            onClick={toggleAutoRefresh}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refresh' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search by User ID</label>
              <Input
                placeholder="Enter user ID (e.g., user_001)"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Button onClick={handleUserSearch} disabled={loading}>
              Search
            </Button>
            <Button onClick={clearUserFilter} variant="outline" disabled={loading}>
              Clear Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.unique_users} unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average WPM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_wpm}</div>
              <p className="text-xs text-muted-foreground">
                Range: {stats.min_wpm} - {stats.max_wpm}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Average Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_accuracy}%</div>
              <p className="text-xs text-muted-foreground">
                Typing precision
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Performer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {stats.top_performers[0]?.user_id || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.top_performers[0]?.average_wpm || 0} WPM avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Latest Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.recent_activity[0]?.user_id || 'No activity'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.recent_activity[0]?.words_per_minute || 0} WPM
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* WPM Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">WPM Trend (Last 20 Sessions)</CardTitle>
            <CardDescription>Words per minute over recent sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Session ${label}`}
                    formatter={(value, name) => [value, name === 'wpm' ? 'WPM' : name]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="wpm" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Accuracy vs Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accuracy vs Errors</CardTitle>
            <CardDescription>Relationship between accuracy and error count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="accuracy" 
                    stackId="1"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device Distribution</CardTitle>
            <CardDescription>Typing sessions by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percentage }) => `${device} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {deviceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performers</CardTitle>
            <CardDescription>Users with highest average WPM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.top_performers.slice(0, 5).map((performer, index) => (
                <div key={performer.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{performer.user_id}</div>
                      <div className="text-xs text-gray-500">{performer.session_count} sessions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{performer.average_wpm} WPM</div>
                    <div className="text-xs text-gray-500">{performer.average_accuracy}% accuracy</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Recent Typing Sessions
            <Badge variant="outline">{data.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>WPM</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Words</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 50).map((session, index) => (
                  <TableRow key={`${session.session_id}-${index}`}>
                    <TableCell className="font-mono text-xs">
                      {new Date(session.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{session.user_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${
                        session.words_per_minute >= 60 ? 'text-green-600' :
                        session.words_per_minute >= 40 ? 'text-blue-600' :
                        'text-orange-600'
                      }`}>
                        {session.words_per_minute}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`${
                        session.accuracy_percentage >= 95 ? 'text-green-600' :
                        session.accuracy_percentage >= 90 ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {session.accuracy_percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>{session.word_count}</TableCell>
                    <TableCell>
                      <span className={session.errors_count > 3 ? 'text-red-600' : 'text-gray-600'}>
                        {session.errors_count}
                      </span>
                    </TableCell>
                    <TableCell>{(session.typing_duration_ms / 1000).toFixed(1)}s</TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.device_type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
