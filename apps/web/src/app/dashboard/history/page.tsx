'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function NotificationHistoryPage() {
  // Mock data for demonstration
  const [history] = useState([
    {
      id: '1',
      title: 'New article matching "AI technology"',
      channel: 'email',
      status: 'sent',
      sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      rule: { name: 'AI News Alert' },
    },
    {
      id: '2',
      title: 'Breaking news about market trends',
      channel: 'slack',
      status: 'sent',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      rule: { name: 'Business Updates' },
    },
    {
      id: '3',
      title: 'Tech startup funding announcement',
      channel: 'email',
      status: 'failed',
      sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      errorMessage: 'SMTP connection failed',
      rule: { name: 'Startup News' },
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      sent: { variant: 'default', className: 'bg-green-500', label: '送信済み' },
      failed: { variant: 'destructive', label: '失敗' },
      pending: { variant: 'secondary', label: '保留中' },
      read: { variant: 'outline', label: '既読' },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="通知履歴">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">通知履歴</h2>
          <p className="text-muted-foreground">送信された通知の履歴</p>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">通知履歴はまだありません</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getStatusIcon(item.status)}
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription>
                          ルール: {item.rule.name} • チャンネル:{' '}
                          <Badge variant="outline" className="text-xs">
                            {item.channel}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(item.sentAt)}</span>
                    {item.status === 'failed' && item.errorMessage && (
                      <span className="text-destructive text-xs">{item.errorMessage}</span>
                    )}
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
