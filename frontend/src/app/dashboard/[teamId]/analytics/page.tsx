'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Loader } from '@/components/ui/Loader';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { fetchTeamAnalytics, fetchEmbedAnalytics, fetchTeamEmbeds } from '@/lib/api';

export default function AnalyticsDashboard() {
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [selectedEmbed, setSelectedEmbed] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Fetch team embeds
  const { data: embeds = [], isLoading: isLoadingEmbeds } = useQuery({
    queryKey: ['embeds', teamId],
    queryFn: () => fetchTeamEmbeds(teamId),
  });

  // Fetch analytics data
  const { data: analyticsData = [], isLoading: isLoadingAnalytics } = useQuery({
    queryKey: [
      'analytics',
      teamId,
      selectedEmbed,
      period,
      dateRange.startDate?.toISOString(),
      dateRange.endDate?.toISOString(),
    ],
    queryFn: async () => {
      if (selectedEmbed === 'all') {
        return fetchTeamAnalytics(
          teamId,
          period,
          dateRange.startDate,
          dateRange.endDate
        );
      } else {
        return fetchEmbedAnalytics(
          selectedEmbed,
          period,
          dateRange.startDate,
          dateRange.endDate
        );
      }
    },
  });

  // Prepare chart data
  const conversationData = analyticsData.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    conversations: item.totalConversations,
  }));

  const messageCountData = analyticsData.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    avgMessages: item.averageMessageCount,
    avgUserMessages: item.averageUserMessages,
    avgAssistantMessages: item.averageAssistantMessages,
  }));

  const tokenUsageData = analyticsData.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    totalTokens: item.totalTokens,
    promptTokens: item.promptTokens,
    completionTokens: item.completionTokens,
  }));

  // Calculate summary metrics
  const totalConversations = analyticsData.reduce(
    (sum: number, item: any) => sum + item.totalConversations,
    0
  );

  const avgMessageCount =
    analyticsData.length > 0
      ? analyticsData.reduce(
          (sum: number, item: any) => sum + item.averageMessageCount,
          0
        ) / analyticsData.length
      : 0;

  const totalTokens = analyticsData.reduce(
    (sum: number, item: any) => sum + item.totalTokens,
    0
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Select
            value={selectedEmbed}
            onValueChange={(value) => setSelectedEmbed(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Embed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Embeds</SelectItem>
              {embeds.map((embed: any) => (
                <SelectItem key={embed.id} value={embed.id}>
                  {embed.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={period}
            onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setPeriod(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <DatePicker
              date={dateRange.startDate}
              setDate={(date) =>
                setDateRange((prev) => ({ ...prev, startDate: date }))
              }
              placeholder="Start Date"
            />
            <span>to</span>
            <DatePicker
              date={dateRange.endDate}
              setDate={(date) =>
                setDateRange((prev) => ({ ...prev, endDate: date }))
              }
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {isLoadingAnalytics || isLoadingEmbeds ? (
        <div className="flex justify-center items-center h-64">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalConversations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Messages per Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{avgMessageCount.toFixed(1)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tokens Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalTokens.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="conversations" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="messages">Message Counts</TabsTrigger>
              <TabsTrigger value="tokens">Token Usage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conversations" className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Volume</CardTitle>
                  <CardDescription>
                    Number of conversations over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {conversationData.length > 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-64 w-full bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg flex items-end justify-around px-4 pb-4">
                          {conversationData.slice(-7).map((item, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div 
                                className="bg-blue-500 dark:bg-blue-400 w-12 rounded-t-md" 
                                style={{ 
                                  height: `${Math.max(20, (item.conversations / Math.max(...conversationData.slice(-7).map(d => d.conversations))) * 200)}px` 
                                }}
                              ></div>
                              <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">{item.date}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                          Showing last 7 data points
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No data available for the selected period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="messages" className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Message Counts</CardTitle>
                  <CardDescription>
                    Average messages per conversation
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {messageCountData.length > 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-64 w-full bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 rounded-lg flex items-end justify-around px-4 pb-4">
                          {messageCountData.slice(-7).map((item, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div className="flex flex-col items-center gap-1">
                                <div 
                                  className="bg-purple-500 dark:bg-purple-400 w-12 rounded-t-md" 
                                  style={{ 
                                    height: `${Math.max(20, (item.avgAssistantMessages / 20) * 200)}px` 
                                  }}
                                ></div>
                                <div 
                                  className="bg-green-500 dark:bg-green-400 w-12" 
                                  style={{ 
                                    height: `${Math.max(20, (item.avgUserMessages / 20) * 200)}px` 
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">{item.date}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-center gap-4 text-sm">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 dark:bg-purple-400 mr-2 rounded-sm"></div>
                            <span className="text-gray-600 dark:text-gray-400">Assistant</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 mr-2 rounded-sm"></div>
                            <span className="text-gray-600 dark:text-gray-400">User</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No data available for the selected period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tokens" className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Token Usage</CardTitle>
                  <CardDescription>
                    Token consumption over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {tokenUsageData.length > 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-64 w-full bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-lg flex items-end justify-around px-4 pb-4">
                          {tokenUsageData.slice(-7).map((item, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div className="flex flex-col items-center gap-1">
                                <div 
                                  className="bg-indigo-500 dark:bg-indigo-400 w-12 rounded-t-md" 
                                  style={{ 
                                    height: `${Math.max(20, (item.totalTokens / Math.max(...tokenUsageData.slice(-7).map(d => d.totalTokens))) * 200)}px` 
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">{item.date}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                          Total tokens used per day
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No data available for the selected period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
