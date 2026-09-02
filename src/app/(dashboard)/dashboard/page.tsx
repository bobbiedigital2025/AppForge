'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/generate')
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="font-semibold">AppForge Dashboard</h1>
        </div>
        <Button variant="gradient" size="sm" onClick={() => router.push('/')}>
          New Project <ArrowRight className="w-3 h-3" />
        </Button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">Your Projects</h2>
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-white/40 mb-4">No projects yet. Start by describing an app idea.</p>
              <Button variant="gradient" onClick={() => router.push('/')}>
                Create your first app
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {projects.map((id) => (
              <Card key={id} className="cursor-pointer hover:border-white/20 transition-all" onClick={() => router.push(`/dashboard/${id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{id}</h3>
                    <Badge variant="info" className="mt-1">In progress</Badge>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
