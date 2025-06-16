"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function NotFoundContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || 'unknown page';

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        The page you were looking for ({from}) could not be found.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Loading...
        </p>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
} 