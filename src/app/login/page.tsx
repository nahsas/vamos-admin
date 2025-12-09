
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError('Email atau kata sandi salah. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen login-bg px-4">
      <Card className="w-full max-w-sm shadow-xl bg-card/80 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center space-y-2">
            <div className="flex justify-center items-center mb-2">
                <Image src="https://vamos-api.sejadikopi.com/storage/Logo/sejadi_logo.jpg" alt="Sejadi Kopi Logo" width={80} height={80} className="rounded-full shadow-lg" unoptimized />
            </div>
          <CardTitle className="text-3xl font-bold font-headline">Vamos</CardTitle>
          <CardDescription>Masukkan kredensial Anda untuk mengakses dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="bg-white/10 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                placeholder="********"
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="bg-white/10 placeholder:text-gray-400"
              />
            </div>
             {error && <p className="text-sm font-medium text-destructive pt-2 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
           <p className="text-xs text-muted-foreground text-center w-full">© 2025 Vamos. Hak cipta dilindungi.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
