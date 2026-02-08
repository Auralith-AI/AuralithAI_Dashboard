'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { getSupabaseBrowserClient } = await import('@/util/supabase');
            const supabase = getSupabaseBrowserClient();

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">

                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">Auralith AI</h1>
                    <p className="text-muted">Reset your password</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8 border-t-4 border-cyan-500">

                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="text-green-500" size={32} />
                            </div>
                            <h2 className="text-xl font-bold">Check your email!</h2>
                            <p className="text-muted text-sm">
                                We sent a password reset link to <strong className="text-foreground">{email}</strong>.
                            </p>
                            <Link href="/login" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mt-4">
                                <ArrowLeft size={16} /> Back to login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleResetRequest} className="space-y-6">

                            <p className="text-sm text-muted">
                                Enter your email address and we will send you a link to reset your password.
                            </p>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg p-3 focus:border-cyan-500 outline-none transition-all"
                                        placeholder="you@company.com"
                                    />
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
                                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>

                            {/* Back to Login */}
                            <div className="text-center">
                                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors">
                                    <ArrowLeft size={16} /> Back to login
                                </Link>
                            </div>
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
