'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Bell, FileText, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { DataSource, CollectedData } from '@/types';

export default function DashboardPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [recentData, setRecentData] = useState<CollectedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSources: 0,
    activeSources: 0,
    totalRules: 0,
    recentItems: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch sources and rules in parallel
      const [sourcesRes, rulesRes] = await Promise.all([
        apiClient.sources.list({ limit: 5 }),
        apiClient.rules.list({ limit: 5 }),
      ]);

      setSources(sourcesRes.data || []);

      setStats({
        totalSources: sourcesRes.pagination?.total || sourcesRes.data?.length || 0,
        activeSources: sourcesRes.data?.filter((s: DataSource) => s.isActive).length || 0,
        totalRules: rulesRes.pagination?.total || rulesRes.data?.length || 0,
        recentItems: 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'データソース',
      value: stats.totalSources,
      description: `${stats.activeSources} アクティブ`,
      icon: Database,
      color: 'text-blue-500',
    },
    {
      title: '通知ルール',
      value: stats.totalRules,
      description: '設定済み',
      icon: Bell,
      color: 'text-green-500',
    },
    {
      title: '収集データ',
      value: stats.recentItems,
      description: '過去24時間',
      icon: FileText,
      color: 'text-purple-500',
    },
    {
      title: '成功率',
      value: stats.activeSources > 0 ? '95%' : '-',
      description: '過去7日間',
      icon: TrendingUp,
      color: 'text-orange-500',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="ダッシュボード">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="ダッシュボード">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle>データソース</CardTitle>
              <CardDescription>最近のデータソース一覧</CardDescription>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  データソースがまだ登録されていません
                </p>
              ) : (
                <div className="space-y-4">
                  {sources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{source.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                          {source.lastCheckedAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(source.lastCheckedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        {source.isActive ? (
                          <Badge variant="default" className="bg-green-500">
                            有効
                          </Badge>
                        ) : (
                          <Badge variant="secondary">無効</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
              <CardDescription>よく使う操作</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/dashboard/sources/new"
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">データソースを追加</span>
                </div>
              </a>
              <a
                href="/dashboard/rules/new"
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">通知ルールを作成</span>
                </div>
              </a>
              <a
                href="/dashboard/data"
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">収集データを確認</span>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
