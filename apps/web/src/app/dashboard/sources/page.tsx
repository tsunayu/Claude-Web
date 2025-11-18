'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Trash2, Edit } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import type { DataSource } from '@/types';

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await apiClient.sources.list();
      setSources(response.data || []);
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'データソースの取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このデータソースを削除してもよろしいですか？')) return;

    try {
      await apiClient.sources.delete(id);
      toast({
        title: '削除成功',
        description: 'データソースを削除しました',
      });
      fetchSources();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'データソースの削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleCollect = async (id: string) => {
    try {
      await apiClient.jobs.collect({ sourceId: id, force: true });
      toast({
        title: '収集開始',
        description: 'データ収集ジョブを開始しました',
      });
    } catch (error: any) {
      toast({
        title: 'エラー',
        description: error.response?.data?.message || 'データ収集の開始に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const getSourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rss: 'RSS Feed',
      twitter: 'Twitter',
      web: 'Web',
      news_api: 'NewsAPI',
      webhook: 'Webhook',
    };
    return labels[type] || type;
  };

  return (
    <DashboardLayout title="データソース管理">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">データソース</h2>
            <p className="text-muted-foreground">情報収集元の管理</p>
          </div>
          <Link href="/dashboard/sources/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </Link>
        </div>

        {/* Sources List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : sources.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">データソースがまだ登録されていません</p>
                <Link href="/dashboard/sources/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    最初のデータソースを追加
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <Card key={source.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline">{getSourceTypeLabel(source.type)}</Badge>
                      </CardDescription>
                    </div>
                    <Badge variant={source.isActive ? 'default' : 'secondary'} className={source.isActive ? 'bg-green-500' : ''}>
                      {source.isActive ? '有効' : '無効'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">チェック間隔</span>
                      <span>{Math.floor(source.checkInterval / 60)}分</span>
                    </div>
                    {source.lastCheckedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">最終チェック</span>
                        <span>{formatRelativeTime(source.lastCheckedAt)}</span>
                      </div>
                    )}
                    {source.errorCount > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>エラー回数</span>
                        <span>{source.errorCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCollect(source.id)} disabled={!source.isActive}>
                      <Play className="mr-1 h-3 w-3" />
                      収集
                    </Button>
                    <Link href={`/dashboard/sources/${source.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-1 h-3 w-3" />
                        編集
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(source.id)}>
                      <Trash2 className="mr-1 h-3 w-3" />
                      削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
