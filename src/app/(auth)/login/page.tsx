
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LogInIcon } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast'; // Already handled by AuthContext

export default function LoginPage() {
  const { login, loading } = useAuth();
  // const { toast } = useToast(); // Toasts for errors are now handled in AuthContext
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState(''); // Errors are now shown as toasts from AuthContext

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // setError(''); // Not needed anymore
    try {
      await login(email, password);
      // Redirect is handled by AuthContext on success
    } catch (err) {
      // Error is caught and toasted by AuthContext
      // setError('Failed to login. Please check your credentials.'); // No longer setting local error
      console.error("Login page caught error (already toasted by context):", err);
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md shadow-xl rounded-none">
        <CardHeader className="text-center">
          <LogInIcon size={48} className="mx-auto mb-4 text-primary" />
          <CardTitle className="text-3xl font-bold font-headline">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue to Wizzzey Store.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            {/* {error && <p className="text-sm text-destructive">{error}</p>} Local error display removed */}
            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? <LoadingSpinner size={20} color="text-primary-foreground" /> : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <Link href="#" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    
