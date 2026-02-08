'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClientComponentClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('Check your email for the password reset link.');
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 relative z-10 glass-card p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Enter your email to receive a recovery link
                    </p>
                </div>

                {message ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center animate-fade-in">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Email Sent</h3>
                        <p className="text-gray-400 text-sm mb-6">{message}</p>
                        <Link href="/login" className="text-green-400 hover:text-green-300 font-medium text-sm">
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleReset}>
                        <div className="rounded-md shadow-sm">
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-gray-300 mb-1">
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none relative block w-full pl-10 px-3 py-3 border border-white/10 bg-white/5 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="flex items-center justify-center gap-2 font-medium text-gray-400 hover:text-white transition-colors text-sm">
                                <ArrowLeft size={14} /> Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
