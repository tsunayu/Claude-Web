'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';

const registerSchema = z
  .object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    username: z
      .string()
      .min(3, 'ユーザー名は3文字以上である必要があります')
      .max(30, 'ユーザー名は30文字以内である必要があります')
      .regex(/^[a-zA-Z0-9_-]+$/, 'ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上である必要があります')
      .regex(/[A-Z]/, 'パスワードには大文字が含まれている必要があります')
      .regex(/[a-z]/, 'パスワードには小文字が含まれている必要があります')
      .regex(/[0-9]/, 'パスワードには数字が含まれている必要があります'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.username, data.password);
      // Success - will be redirected to dashboard
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = '登録に失敗しました。もう一度お試しください。';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'サーバーへの接続がタイムアウトしました。バックエンドAPIが起動しているか確認してください。';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'サーバーに接続できません。バックエンドAPIが起動しているか確認してください（http://localhost:3001）';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(`登録失敗\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">新規登録</CardTitle>
          <CardDescription>アカウントを作成して始めましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@example.com"
                {...register('email')}
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                {...register('username')}
                disabled={loading}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={loading}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : '登録'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            すでにアカウントをお持ちの場合は
            <Link href="/login" className="ml-1 text-primary hover:underline">
              ログイン
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
