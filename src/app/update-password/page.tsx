'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check for session on mount to ensure link was valid
        const checkSession = async () => {
            const { getSupabaseBrowserClient } = await import('@/util/supabase');
            const supabase = getSupabaseBrowserClient();
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                // If no session, the link might be invalid or they are not logged in.
                // We won't redirect immediately to allow the user to see what's happening, 
                // but we'll show a warning if they try to submit.
                console.log("No active session found on update-password page.");
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const { getSupabaseBrowserClient } = await import('@/util/supabase');
            const supabase = getSupabaseBrowserClient();

            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">

                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">Auralith AI</h1>
                    <p className="text-muted">Set your new password</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8 border-t-4 border-green-500">

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="text-green-500" size={32} />
                            </div>
                            <h2 className="text-xl font-bold">Password Updated!</h2>
                            <p className="text-muted text-sm">
                                Redirecting you to login...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-6">

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 bg-white/5 border border-white/10 rounded-lg p-3 focus:border-green-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 bg-white/5 border border-white/10 rounded-lg p-3 focus:border-green-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted mt-8">
                    &copy; {new Date().getFullYear()} Auralith AI. All rights reserved.
                </p>
            </div>
        </div>
    );
}
