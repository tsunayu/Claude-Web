'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';

const sourceSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  type: z.enum(['rss', 'twitter', 'web', 'news_api', 'webhook']),
  checkInterval: z.number().min(60).max(86400),
  isActive: z.boolean(),
});

type SourceForm = z.infer<typeof sourceSchema>;

export default function NewDataSourcePage() {
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<string>('rss');
  const [configJson, setConfigJson] = useState('{\n  \n}');
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SourceForm>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      checkInterval: 300,
      isActive: true,
    },
  });

  const onSubmit = async (data: SourceForm) => {
    setLoading(true);
    try {
      let config;
      try {
        config = JSON.parse(configJson);
      } catch (e) {
        throw new Error('設定JSONが無効です');
      }

      await apiClient.sources.create({
        ...data,
        config,
      });

      toast({
        title: '作成成功',
        description: 'データソースを作成しました',
      });

      router.push('/dashboard/sources');
    } catch (error: any) {
      toast({
        title: 'エラー',
        description: error.message || error.response?.data?.message || 'データソースの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfigExample = (type: string) => {
    const examples: Record<string, string> = {
      rss: `{
  "url": "https://example.com/feed.xml"
}`,
      twitter: `{
  "bearerToken": "YOUR_TWITTER_BEARER_TOKEN",
  "accounts": ["username1", "username2"],
  "keywords": ["keyword1", "keyword2"]
}`,
      web: `{
  "url": "https://example.com",
  "usePuppeteer": false,
  "selectors": {
    "title": "h1",
    "content": ".article-content",
    "author": ".author",
    "date": "time",
    "image": "img.featured"
  }
}`,
      news_api: `{
  "apiKey": "YOUR_NEWS_API_KEY",
  "query": "technology",
  "category": "technology",
  "country": "us"
}`,
      webhook: `{
  "secret": "your_webhook_secret"
}`,
    };
    return examples[type] || '{\n  \n}';
  };

  const handleTypeChange = (value: string) => {
    setSourceType(value);
    setValue('type', value as any);
    setConfigJson(getConfigExample(value));
  };

  return (
    <DashboardLayout title="データソース新規作成">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">データソース新規作成</h2>
          <p className="text-muted-foreground">新しい情報収集元を追加します</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>データソースの基本的な設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前 *</Label>
                <Input id="name" placeholder="My RSS Feed" {...register('name')} disabled={loading} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">タイプ *</Label>
                <Select value={sourceType} onValueChange={handleTypeChange} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rss">RSS Feed</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="web">Web Scraper</SelectItem>
                    <SelectItem value="news_api">News API</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkInterval">チェック間隔 (秒) *</Label>
                <Input
                  id="checkInterval"
                  type="number"
                  placeholder="300"
                  {...register('checkInterval', { valueAsNumber: true })}
                  disabled={loading}
                />
                {errors.checkInterval && <p className="text-sm text-destructive">{errors.checkInterval.message}</p>}
                <p className="text-xs text-muted-foreground">60秒〜86400秒（24時間）の範囲で設定してください</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">有効化</Label>
                  <p className="text-sm text-muted-foreground">作成後すぐにデータ収集を開始します</p>
                </div>
                <Switch
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>設定 (JSON)</CardTitle>
              <CardDescription>データソースの詳細設定をJSON形式で入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                placeholder="JSON設定"
                className="min-h-[200px] font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                選択したタイプに応じた設定を入力してください
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? '作成中...' : '作成'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
