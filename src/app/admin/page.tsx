'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, FolderKanban, Activity, Shield, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}

interface AdminProject {
  id: string;
  name: string;
  idea: string;
  status: string;
  progress: number;
  created_at: string;
  user_email: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, completedProjects: 0, activeProjects: 0 });

  // Check if user is admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      checkAdmin();
    }
  }, [user, loading, router]);

  const checkAdmin = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (data?.role === 'admin') {
      setIsAdmin(true);
      loadAdminData();
    }
    setCheckingAdmin(false);
  };

  const loadAdminData = async () => {
    const supabase = createClient();

    // Load all profiles (admin policy allows this)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setProfiles(profilesData || []);

    // Load all projects using the admin client via API
    const res = await fetch('/api/admin/projects');
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects || []);
      setStats({
        totalUsers: profilesData?.length || 0,
        totalProjects: data.projects?.length || 0,
        completedProjects: data.projects?.filter((p: AdminProject) => p.status === 'completed').length || 0,
        activeProjects: data.projects?.filter((p: AdminProject) => p.status !== 'completed').length || 0,
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading || checkingAdmin) {
    return <div className="min-h-screen bg-black" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-white/40 mb-6">You need admin access to view this page.</p>
          <Button variant="gradient" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h1 className="font-semibold">AppForge Admin</h1>
          <Badge variant="info" className="ml-2">Admin Panel</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
            Dashboard <ArrowRight className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-3 h-3" /> Sign out
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-white/40">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalProjects}</p>
                  <p className="text-xs text-white/40">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedProjects}</p>
                  <p className="text-xs text-white/40">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                  <p className="text-xs text-white/40">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <p className="text-white/40 text-sm">No users yet.</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                        {(p.name || p.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.name || p.email}</p>
                        <p className="text-xs text-white/40">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.role === 'admin' ? 'success' : 'info'}>
                        {p.role}
                      </Badge>
                      <span className="text-xs text-white/30">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4" /> All Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-white/40 text-sm">No projects yet.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition cursor-pointer"
                    onClick={() => router.push(`/dashboard/${p.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-white/40 line-clamp-1">{p.idea}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.user_email && (
                        <span className="text-xs text-white/30">{p.user_email}</span>
                      )}
                      <Badge variant={p.status === 'completed' ? 'success' : 'info'}>
                        {p.status}
                      </Badge>
                      <span className="text-xs text-white/30">{p.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
