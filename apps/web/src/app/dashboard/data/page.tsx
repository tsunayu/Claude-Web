'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function CollectedDataPage() {
  // Mock data for demonstration
  const [data] = useState([
    {
      id: '1',
      title: 'Sample Article Title 1',
      summary: 'This is a summary of the collected article content...',
      url: 'https://example.com/article1',
      author: 'John Doe',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      tags: ['technology', 'ai'],
      source: { name: 'Tech News RSS' },
    },
    {
      id: '2',
      title: 'Sample Article Title 2',
      summary: 'Another interesting article about recent developments...',
      url: 'https://example.com/article2',
      author: 'Jane Smith',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      tags: ['business', 'startup'],
      source: { name: 'Business Feed' },
    },
  ]);

  return (
    <DashboardLayout title="収集データ">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">収集データ</h2>
            <p className="text-muted-foreground">収集された情報の閲覧</p>
          </div>
        </div>

        {data.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">収集されたデータはまだありません</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>
                        {item.author && <span>{item.author} • </span>}
                        {formatRelativeTime(item.publishedAt)} • {item.source.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        元記事を開く
                      </a>
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
