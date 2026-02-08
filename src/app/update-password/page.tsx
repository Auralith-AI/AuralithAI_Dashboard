'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('Password updated successfully!');
                setTimeout(() => router.push('/'), 2000);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-600/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 relative z-10 glass-card p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        Set New Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Enter your new secure password below
                    </p>
                </div>

                {message ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center animate-fade-in">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Success!</h3>
                        <p className="text-gray-400 text-sm mb-2">{message}</p>
                        <p className="text-xs text-muted">Redirecting...</p>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleUpdate}>
                        <div className="rounded-md shadow-sm">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength={6}
                                        className="appearance-none relative block w-full pl-10 px-3 py-3 border border-white/10 bg-white/5 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
