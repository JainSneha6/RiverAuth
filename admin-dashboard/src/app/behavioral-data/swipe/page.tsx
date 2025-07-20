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
import { MousePointer, TrendingUp, Users, Zap, Navigation, RefreshCw } from 'lucide-react';

interface SwipeData {
  timestamp: string;
  user_id: string;
  session_id: string;
  swipe_direction: string;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  distance_pixels: number;
  duration_ms: number;
  velocity_pixels_per_ms: number;
  acceleration: number;
  pressure_start: number;
  pressure_end: number;
  pressure_variance: number;
  touch_area_start: number;
  touch_area_end: number;
  curve_deviation: number;
  device_type: string;
  screen_orientation: string;
}

interface SwipeStats {
  total_swipes: number;
  average_velocity: number;
  average_distance: number;
  direction_distribution: Record<string, number>;
  unique_users: number;
  velocity_range: { min: number; max: number };
  top_swipers: Array<{
    user_id: string;
    swipe_count: number;
    average_velocity: number;
    average_distance: number;
    last_swipe: string;
  }>;
  recent_activity: SwipeData[];
}

export default function SwipeDataPage() {
  const [data, setData] = useState<SwipeData[]>([]);
  const [stats, setStats] = useState<SwipeStats | null>(null);
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

      const response = await fetch(`/api/swipe-data?${params}`);
      const result = await response.json();

      if (result.data) {
        setData(result.data);
        setStats(result.stats);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching swipe data:', error);
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
    swipe: `S${index + 1}`,
    velocity: item.velocity_pixels_per_ms,
    distance: item.distance_pixels,
    duration: item.duration_ms,
    timestamp: new Date(item.timestamp).toLocaleTimeString()
  }));

  // Direction distribution for pie chart
  const directionChartData = Object.entries(stats?.direction_distribution || {}).map(([direction, count]) => ({
    direction: direction.replace('_', ' ').toUpperCase(),
    count,
    percentage: Math.round((count / (stats?.total_swipes || 1)) * 100)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const getDirectionIcon = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'up': return '⬆️';
      case 'down': return '⬇️';
      case 'left': return '⬅️';
      case 'right': return '➡️';
      case 'diagonal_up_left': return '↖️';
      case 'diagonal_up_right': return '↗️';
      default: return '🔄';
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
              <Link href="/behavioral-data/swipe">Swipe Data</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MousePointer className="h-6 w-6 text-green-600" />
            <h1 className="text-3xl font-bold">Swipe Gesture Analysis</h1>
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
                Total Swipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_swipes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.unique_users} unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Avg Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_velocity}</div>
              <p className="text-xs text-muted-foreground">
                px/ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Avg Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_distance}</div>
              <p className="text-xs text-muted-foreground">
                pixels
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Swiper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {stats.top_swipers[0]?.user_id || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.top_swipers[0]?.swipe_count || 0} swipes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Velocity Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {stats.velocity_range.min.toFixed(2)} - {stats.velocity_range.max.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                px/ms range
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Velocity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Velocity Trend (Last 20 Swipes)</CardTitle>
            <CardDescription>Swipe velocity over recent gestures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="swipe" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Swipe ${label}`}
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toFixed(3) : value, 
                      name === 'velocity' ? 'Velocity (px/ms)' : name
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="velocity" 
                    stroke="#00C49F" 
                    strokeWidth={2}
                    dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distance vs Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distance vs Duration</CardTitle>
            <CardDescription>Relationship between swipe distance and time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="swipe" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="distance" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Direction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Direction Distribution</CardTitle>
            <CardDescription>Swipe directions breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={directionChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ direction, percentage }) => `${direction} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {directionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Swipers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Swipers</CardTitle>
            <CardDescription>Users with most swipe activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.top_swipers.slice(0, 5).map((swiper, index) => (
                <div key={swiper.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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
                      <div className="font-medium">{swiper.user_id}</div>
                      <div className="text-xs text-gray-500">Avg: {swiper.average_velocity.toFixed(3)} px/ms</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{swiper.swipe_count} swipes</div>
                    <div className="text-xs text-gray-500">{swiper.average_distance}px avg</div>
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
            Recent Swipe Gestures
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
                  <TableHead>Direction</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Velocity</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Start Point</TableHead>
                  <TableHead>End Point</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 50).map((swipe, index) => (
                  <TableRow key={`${swipe.session_id}-${index}`}>
                    <TableCell className="font-mono text-xs">
                      {new Date(swipe.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{swipe.user_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {getDirectionIcon(swipe.swipe_direction)}
                        {swipe.swipe_direction.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{swipe.distance_pixels}px</span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono ${
                        swipe.velocity_pixels_per_ms > 1.5 ? 'text-green-600' :
                        swipe.velocity_pixels_per_ms > 1.0 ? 'text-blue-600' :
                        'text-orange-600'
                      }`}>
                        {swipe.velocity_pixels_per_ms.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell>{swipe.duration_ms}ms</TableCell>
                    <TableCell className="font-mono text-xs">
                      ({swipe.start_x}, {swipe.start_y})
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      ({swipe.end_x}, {swipe.end_y})
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{swipe.device_type}</Badge>
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
