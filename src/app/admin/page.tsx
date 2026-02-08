'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, UserPlus, Building2, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminPage() {
    const router = useRouter();

    // Mount check to ensure client-only rendering
    const [mounted, setMounted] = useState(false);

    // Dynamically import useAuth only on client
    const [authState, setAuthState] = useState<{
        user: any;
        profile: any;
        loading: boolean;
    }>({ user: null, profile: null, loading: true });

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [clientName, setClientName] = useState('');
    const [role, setRole] = useState('admin');
    const [adminSecret, setAdminSecret] = useState('admin_10m');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ status: string, message: string } | null>(null);

    useEffect(() => {
        setMounted(true);

        // Dynamically import and use auth
        const loadAuth = async () => {
            const { useAuth } = await import('@/util/AuthContext');
            // This won't work directly, so we use a different approach
        };

        // Instead, check auth via direct fetch to session
        const checkAuth = async () => {
            try {
                const { createBrowserClient } = await import('@supabase/ssr');
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.user) {
                    router.push('/login');
                    return;
                }

                // Get profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setAuthState({
                    user: session.user,
                    profile: profile,
                    loading: false
                });
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('https://auraalithai--auraalith-dashboard-create-dashboard-user.modal.run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_secret: adminSecret,
                    email,
                    password,
                    client_name: clientName,
                    role
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                setResult({ status: 'success', message: `Successfully created user for ${clientName}!` });
                setEmail('');
                setPassword('');
                setClientName('');
            } else {
                setResult({ status: 'error', message: data.message || 'Failed to create user' });
            }

        } catch (err) {
            setResult({ status: 'error', message: 'Connection failed to backend' });
        } finally {
            setLoading(false);
        }
    };

    // Don't render until mounted and auth checked
    if (!mounted || authState.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                    <p className="text-muted text-sm">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    if (!authState.user) return null;

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">

            <header className="mb-8 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <Shield size={32} className="text-purple-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Super Admin Panel</h1>
                    <p className="text-muted text-sm">User Management &amp; Provisioning</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Create User Form */}
                <section className="glass-card p-6 border-t-4 border-purple-500">
                    <div className="flex items-center gap-2 mb-6">
                        <UserPlus className="text-purple-400" />
                        <h2 className="text-xl font-bold">Provision New Client</h2>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Company / Full Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg p-2.5 focus:border-purple-500 outline-none transition-all"
                                        placeholder="e.g. ReMax Sunshine"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Role</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 focus:border-purple-500 outline-none"
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                >
                                    <option value="admin">Team Leader (Admin)</option>
                                    <option value="agent">Agent</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 focus:border-purple-500 outline-none transition-all"
                                    placeholder="client@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Temp Password</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 focus:border-purple-500 outline-none transition-all"
                                    placeholder="Secret123!"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-mono text-gray-500 mb-1">Admin Secret (Security Check)</label>
                            <input
                                type="password"
                                className="w-full bg-black/20 border border-white/5 rounded p-2 text-xs font-mono text-gray-400"
                                value={adminSecret}
                                onChange={e => setAdminSecret(e.target.value)}
                            />
                        </div>

                        {result && (
                            <div className={`p-4 rounded-lg flex items-center gap-3 ${result.status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {result.status === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <p className="text-sm font-medium">{result.message}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                            {loading ? 'Provisioning...' : 'Create Account'}
                        </button>
                    </form>
                </section>

                {/* Info Section */}
                <section className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-lg mb-4">How Multi-Tenancy Works</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                                <span><strong>Team Leaders (Admins):</strong> Can see all data for their assigned Company (Client ID).</span>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                                <span><strong>Agents:</strong> See data where they are the &quot;Contact Owner&quot;.</span>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                <span><strong>Client ID</strong> is generated automatically from the company name.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="glass-card p-6 border-l-4 border-yellow-500 bg-yellow-500/5">
                        <h3 className="font-bold text-yellow-500 mb-2">Security Note</h3>
                        <p className="text-sm text-gray-400">
                            Ensure you change the <code>ADMIN_SECRET</code> in your environment variables for production. The current default is for demo purposes.
                        </p>
                    </div>
                </section>

            </div>
        </div>
    );
}
