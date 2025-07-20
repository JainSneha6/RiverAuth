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
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Hand, TrendingUp, Users, Timer, Target, RefreshCw } from 'lucide-react';

interface TapData {
  timestamp: string;
  user_id: string;
  session_id: string;
  tap_x: number;
  tap_y: number;
  pressure: number;
  touch_area: number;
  duration_ms: number;
  tap_type: string;
  screen_zone: string;
  distance_from_previous_tap: number;
  time_since_previous_tap_ms: number;
  tap_sequence_position: number;
  is_double_tap: boolean;
  finger_used: string;
  device_type: string;
  screen_orientation: string;
  app_context: string;
}

interface TapStats {
  total_taps: number;
  average_pressure: number;
  average_duration: number;
  tap_type_distribution: Record<string, number>;
  screen_zone_distribution: Record<string, number>;
  double_tap_percentage: number;
  unique_users: number;
  pressure_range: { min: number; max: number };
  top_tappers: Array<{
    user_id: string;
    tap_count: number;
    average_pressure: number;
    average_duration: number;
    double_tap_count: number;
    last_tap: string;
  }>;
  recent_activity: TapData[];
}

export default function TapDataPage() {
  const [data, setData] = useState<TapData[]>([]);
  const [stats, setStats] = useState<TapStats | null>(null);
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

      const response = await fetch(`/api/tap-data?${params}`);
      const result = await response.json();

      if (result.data) {
        setData(result.data);
        setStats(result.stats);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching tap data:', error);
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
      }, 10000);
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
    tap: `T${index + 1}`,
    pressure: item.pressure,
    duration: item.duration_ms,
    touch_area: item.touch_area,
    timestamp: new Date(item.timestamp).toLocaleTimeString()
  }));

  // Tap type distribution for pie chart
  const tapTypeChartData = Object.entries(stats?.tap_type_distribution || {}).map(([type, count]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count,
    percentage: Math.round((count / (stats?.total_taps || 1)) * 100)
  }));

  // Screen zone distribution for bar chart
  const screenZoneChartData = Object.entries(stats?.screen_zone_distribution || {}).map(([zone, count]) => ({
    zone: zone.replace('_', ' ').toUpperCase(),
    count,
    percentage: Math.round((count / (stats?.total_taps || 1)) * 100)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  const getTapTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'single': return '👆';
      case 'double': return '👆👆';
      case 'long_press': return '✋';
      case 'force_touch': return '💪';
      default: return '👆';
    }
  };

  const getZoneIcon = (zone: string) => {
    switch (zone.toLowerCase()) {
      case 'top': return '⬆️';
      case 'center': return '🎯';
      case 'bottom': return '⬇️';
      case 'left': return '⬅️';
      case 'right': return '➡️';
      case 'top_left': return '↖️';
      case 'top_right': return '↗️';
      case 'bottom_left': return '↙️';
      case 'bottom_right': return '↘️';
      default: return '📍';
    }
  };

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
              <Link href="/behavioral-data/tap">Tap Data</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hand className="h-6 w-6 text-purple-600" />
            <h1 className="text-3xl font-bold">Tap Gesture Analysis</h1>
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
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Taps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_taps}</div>
              <p className="text-xs text-muted-foreground">
                {stats.unique_users} unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Avg Pressure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_pressure}</div>
              <p className="text-xs text-muted-foreground">
                Range: {stats.pressure_range.min.toFixed(2)} - {stats.pressure_range.max.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_duration}</div>
              <p className="text-xs text-muted-foreground">
                milliseconds
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Double Taps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.double_tap_percentage}%</div>
              <p className="text-xs text-muted-foreground">
                of all taps
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Tapper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {stats.top_tappers[0]?.user_id || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.top_tappers[0]?.tap_count || 0} taps
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Most Used Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {Object.entries(stats.screen_zone_distribution).sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ').toUpperCase() || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                screen area
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pressure Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pressure Trend (Last 20 Taps)</CardTitle>
            <CardDescription>Tap pressure over recent gestures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tap" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Tap ${label}`}
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toFixed(3) : value, 
                      name === 'pressure' ? 'Pressure' : name
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pressure" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Duration vs Touch Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Duration vs Touch Area</CardTitle>
            <CardDescription>Relationship between tap duration and contact area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tap" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="duration" 
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

        {/* Tap Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tap Type Distribution</CardTitle>
            <CardDescription>Breakdown of different tap types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tapTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {tapTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Screen Zone Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Screen Zone Distribution</CardTitle>
            <CardDescription>Where users tap most frequently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={screenZoneChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zone" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Tappers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Top Tappers</CardTitle>
          <CardDescription>Users with highest tap activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.top_tappers.slice(0, 6).map((tapper, index) => (
              <div key={tapper.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{tapper.user_id}</div>
                    <div className="text-xs text-gray-500">
                      Pressure: {tapper.average_pressure.toFixed(3)} • Duration: {tapper.average_duration}ms
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">{tapper.tap_count} taps</div>
                  <div className="text-xs text-gray-500">{tapper.double_tap_count} double taps</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Recent Tap Gestures
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
                  <TableHead>Type</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Pressure</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Touch Area</TableHead>
                  <TableHead>Finger</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 50).map((tap, index) => (
                  <TableRow key={`${tap.session_id}-${index}`}>
                    <TableCell className="font-mono text-xs">
                      {new Date(tap.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tap.user_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {getTapTypeIcon(tap.tap_type)}
                        {tap.tap_type.replace('_', ' ')}
                        {tap.is_double_tap && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">2x</span>}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      ({tap.tap_x}, {tap.tap_y})
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {getZoneIcon(tap.screen_zone)}
                        {tap.screen_zone.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono ${
                        tap.pressure > 0.7 ? 'text-red-600' :
                        tap.pressure > 0.5 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {tap.pressure.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`${
                        tap.duration_ms > 500 ? 'text-purple-600 font-bold' : 'text-gray-600'
                      }`}>
                        {tap.duration_ms}ms
                      </span>
                    </TableCell>
                    <TableCell>{tap.touch_area}px²</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{tap.finger_used}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tap.device_type}</Badge>
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
