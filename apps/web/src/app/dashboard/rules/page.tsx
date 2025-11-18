'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import type { NotificationRule } from '@/types';

export default function NotificationRulesPage() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await apiClient.rules.list();
      setRules(response.data || []);
    } catch (error) {
      toast({
        title: 'エラー',
        description: '通知ルールの取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この通知ルールを削除してもよろしいですか？')) return;

    try {
      await apiClient.rules.delete(id);
      toast({
        title: '削除成功',
        description: '通知ルールを削除しました',
      });
      fetchRules();
    } catch (error) {
      toast({
        title: 'エラー',
        description: '通知ルールの削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout title="通知ルール管理">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">通知ルール</h2>
            <p className="text-muted-foreground">通知条件の管理</p>
          </div>
          <Link href="/dashboard/rules/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">通知ルールがまだ登録されていません</p>
                <Link href="/dashboard/rules/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    最初の通知ルールを追加
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{rule.name}</CardTitle>
                      <CardDescription>
                        優先度: {rule.priority} {rule.batchEnabled && '| バッチ通知有効'}
                      </CardDescription>
                    </div>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'} className={rule.isActive ? 'bg-green-500' : ''}>
                      {rule.isActive ? '有効' : '無効'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">キーワード</p>
                      <div className="flex flex-wrap gap-1">
                        {rule.keywords.map((keyword, i) => (
                          <Badge key={i} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {rule.excludeKeywords.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">除外キーワード</p>
                        <div className="flex flex-wrap gap-1">
                          {rule.excludeKeywords.map((keyword, i) => (
                            <Badge key={i} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {rule.sourceTypes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">対象ソースタイプ</p>
                        <div className="flex flex-wrap gap-1">
                          {rule.sourceTypes.map((type, i) => (
                            <Badge key={i} variant="outline">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/dashboard/rules/${rule.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-1 h-3 w-3" />
                        編集
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(rule.id)}>
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
