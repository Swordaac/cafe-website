'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function AuthPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const supabase = createClient();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="rounded-lg border bg-card p-8">
          <h1 className="text-2xl font-semibold text-center mb-6">Welcome Back</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(var(--primary))',
                    brandAccent: 'rgb(var(--primary-foreground))',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`}
            theme="dark"
          />
        </div>
      </div>
    </div>
  );
}