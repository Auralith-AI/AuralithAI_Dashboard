'use client';

// ... Imports ...
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, UserPlus, Building2, Loader2, CheckCircle, AlertTriangle, Eye, Trash2, LogIn } from 'lucide-react';
import { useAuth } from '@/util/AuthContext'; // Import context hook

export default function AdminPage() {
    const router = useRouter();
    const { user, profile, impersonateClient } = useAuth(); // Use context

    // Mount check to ensure client-only rendering
    const [mounted, setMounted] = useState(false);

    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [clientName, setClientName] = useState('');
    // For Broker Admin, force role to 'agent'
    const [role, setRole] = useState('agent');

    // Admin Secret is handled internally now
    const ADMIN_SECRET = 'admin_10m';

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ status: string, message: string } | null>(null);

    // State for user list
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // State for Accordion/Grouping
    const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

    useEffect(() => {
        setMounted(true);
        if (profile) {
            fetchUsers();
            // Default role for super admin
            if (profile.role === 'super_admin') setRole('admin');
        }
    }, [profile]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await fetch('https://auraalithai--auraalith-dashboard-get-dashboard-users.modal.run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_secret: ADMIN_SECRET,
                    requester_role: profile?.role,
                    requester_client_id: profile?.client_id
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setUsers(data.users);

                // Auto-expand own client for Brokers
                if (profile?.role === 'admin') {
                    setExpandedClients(new Set([profile.client_id]));
                }
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('https://auraalithai--auraalith-dashboard-create-dashboard-user.modal.run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_secret: ADMIN_SECRET,
                    email,
                    password,
                    full_name: fullName, // Pass actual name
                    client_name: profile?.role === 'super_admin' ? clientName : undefined, // For new clients
                    target_client_id: profile?.role === 'admin' ? profile.client_id : undefined, // For existing team
                    role: role
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                setResult({ status: 'success', message: `Successfully created user!` });
                setEmail('');
                setPassword('');
                setFullName('');
                if (profile?.role === 'super_admin') setClientName(''); // Only clear if super admin
                fetchUsers(); // Refresh list
            } else {
                setResult({ status: 'error', message: data.message || 'Failed to create user' });
            }

        } catch (err) {
            setResult({ status: 'error', message: 'Connection failed to backend' });
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = (targetClientId: string) => {
        impersonateClient(targetClientId);

        // Use window.location to force a hard reload check, or router if preferred.
        // Router is smoother.
        // We need to ensure the dashboard picks up the change.
        // AuthContext usually handles state, but let's confirm.
        // Ideally router.push('/') works if context updates first.

        // Wait for state update propagation? (Sync issue mitigation)
        setTimeout(() => {
            // Redirect to dashboard
            window.location.href = '/';
        }, 100);
    };

    const handleDeleteUser = async (targetUserId: string) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            const response = await fetch('https://auraalithai--auraalith-dashboard-delete-dashboard-user.modal.run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_secret: ADMIN_SECRET,
                    requester_role: profile?.role,
                    requester_client_id: profile?.client_id,
                    target_user_id: targetUserId
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                fetchUsers(); // Refresh
            } else {
                alert("Failed to delete: " + data.message);
            }
        } catch (err) {
            alert("Error deleting user");
        }
    };

    // Grouping Logic
    const toggleClientExpand = (clientId: string) => {
        const newSet = new Set(expandedClients);
        if (newSet.has(clientId)) {
            newSet.delete(clientId);
        } else {
            newSet.add(clientId);
        }
        setExpandedClients(newSet);
    };

    // Group users by client_id
    const groupedUsers = users.reduce((acc, user) => {
        const cid = user.client_id || 'unknown';
        if (!acc[cid]) {
            acc[cid] = [];
        }
        acc[cid].push(user);
        return acc;
    }, {} as Record<string, any[]>);


    if (!mounted || !user || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <Shield size={32} className="text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {profile.role === 'super_admin' ? 'Super Admin Panel' : 'Team Management'}
                        </h1>
                        <p className="text-muted text-sm">
                            {profile.role === 'super_admin' ? 'Global User Management' : `Manage Agents for ${profile.full_name}`}
                        </p>
                    </div>
                </div>
                <button onClick={() => window.location.href = '/'} className="text-sm text-muted hover:text-white">
                    ← Back to Dashboard
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Create User Form */}
                <section className="lg:col-span-1 glass-card p-6 border-t-4 border-purple-500 h-fit">
                    <div className="flex items-center gap-2 mb-6">
                        <UserPlus className="text-purple-400" />
                        <h2 className="text-xl font-bold">
                            {profile.role === 'super_admin' ? 'Provision New Client' : 'Add New Agent'}
                        </h2>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                        {/* Company Name logic */}
                        {profile.role === 'super_admin' ? (
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Company / Team Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg p-2.5 focus:border-purple-500 outline-none transition-all"
                                        placeholder="e.g. Skyline Realty"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-400">
                                Adding agent to: <span className="text-white font-bold">{profile.full_name}</span>
                            </div>
                        )}

                        {/* Full Name Input (New) */}
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 focus:border-purple-500 outline-none transition-all"
                                placeholder="e.g. John Doe"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                        </div>


                        {/* Role Selection - Super Admin Only */}
                        {profile.role === 'super_admin' && (
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
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 focus:border-purple-500 outline-none transition-all"
                                    placeholder="user@example.com"
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

                        {/* Admin Secret HIDDEN */}

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
                            {loading ? 'Provisioning...' : (profile.role === 'super_admin' ? 'Create Account' : 'Add Agent')}
                        </button>
                    </form>
                </section>

                {/* User List Table (Grouped or Flat) */}
                <section className="lg:col-span-2 space-y-6">
                    <div className="glass-card overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-lg">Active Users</h3>
                            <button onClick={fetchUsers} className="text-xs text-purple-400 hover:text-purple-300">Refresh List</button>
                        </div>

                        <div className="p-0">
                            {loadingUsers ? (
                                <div className="p-8 text-center text-muted flex justify-center"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <div className="space-y-1">
                                    {Object.entries(groupedUsers).map(([clientId, clientUsers]: [string, any]) => {
                                        const isExpanded = expandedClients.has(clientId);
                                        const userCount = clientUsers.length;

                                        // For brokers, we might want to just show the table directly without accordion if they only see one client.
                                        // But consistent UI is good.

                                        return (
                                            <div key={clientId} className="border-b border-white/5 last:border-0">
                                                {/* Header / Folder */}
                                                <div
                                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                                    onClick={() => toggleClientExpand(clientId)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Building2 className={`text-gray-500 ${isExpanded ? 'text-purple-400' : ''}`} size={20} />
                                                        <div>
                                                            <h4 className="font-medium capitalize text-base text-gray-200">
                                                                {clientId.replace(/_/g, ' ')}
                                                            </h4>
                                                            <p className="text-xs text-muted">{userCount} User{userCount !== 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-500 text-xs">
                                                        {isExpanded ? '▼' : '▶'}
                                                    </span>
                                                </div>

                                                {/* Expanded List */}
                                                {isExpanded && (
                                                    <div className="bg-black/20 animate-in slide-in-from-top-2 duration-200">
                                                        <table className="w-full text-left text-sm">
                                                            <thead className="text-muted uppercase tracking-wider font-medium text-xs border-b border-white/5">
                                                                <tr>
                                                                    <th className="p-3 pl-8">Name</th>
                                                                    <th className="p-3">Role</th>
                                                                    <th className="p-3 text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5">
                                                                {clientUsers.map((u: any) => (
                                                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                                        <td className="p-3 pl-8 font-medium">
                                                                            {u.full_name || u.email}
                                                                            {u.id === user?.id && <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">You</span>}
                                                                            {(!u.full_name) && <span className="block text-xs text-muted font-normal">{u.email}</span>}
                                                                        </td>
                                                                        <td className="p-3">
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                                                 ${u.role === 'super_admin' ? 'bg-red-500/10 text-red-400' :
                                                                                    u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                                                                                        'bg-blue-500/10 text-blue-400'}`}>
                                                                                {u.role}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-3 pr-4 flex justify-end gap-2">
                                                                            {/* Impersonate */}
                                                                            {u.id !== user?.id && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleImpersonate(u.client_id); }}
                                                                                    title="View As"
                                                                                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-cyan-400"
                                                                                >
                                                                                    <LogIn size={14} />
                                                                                </button>
                                                                            )}
                                                                            {/* Delete */}
                                                                            {u.id !== user?.id && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                                                                                    title="Delete"
                                                                                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-red-400"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {users.length === 0 && (
                                        <div className="p-8 text-center text-muted">No users found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-500/5">
                        <h3 className="font-bold text-blue-400 mb-2">Management Guide</h3>
                        <ul className="text-sm text-gray-400 space-y-1 list-disc pl-4">
                            <li><strong>Brokers (Admins):</strong> Can only see and add agents to their own team.</li>
                            <li><strong>Super Admins:</strong> Can manage all accounts globally.</li>
                            <li><strong>"Log In As":</strong> Use the <LogIn className="inline w-3 h-3" /> icon to view the dashboard exactly as that user sees it. Click "Exit View" banner to return.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
