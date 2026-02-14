'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            })

            if (authError) {
                console.error('Auth error:', authError)
                throw authError
            }

            if (data.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single()

                console.log('Profile result:', profile, profileError)

                if (profileError) {
                    setError('Profil tidak ditemukan. Hubungi administrator.')
                    return
                }

                if (profile) {
                    const dashboardUrl = profile.role === 'guru' ? '/guru/dashboard' : '/siswa/dashboard'
                    router.push(dashboardUrl)
                    router.refresh()
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Login gagal. Periksa email dan password Anda.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <img src="/sma1.jpg" alt="SMA Negeri 1 Limboto" style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        objectFit: 'cover', margin: '0 auto 0.75rem',
                        display: 'block', border: '3px solid var(--primary-500)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                    }} />
                    <h1>Media Pembelajaran Sejarah</h1>
                    <p>SMA Negeri 1 Limboto</p>
                </div>

                <form onSubmit={handleLogin}>
                    {error && (
                        <div style={{
                            background: 'var(--accent-50)',
                            color: 'var(--accent-700)',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.875rem',
                            marginBottom: '1.25rem',
                            border: '1px solid var(--accent-200)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="Masukkan email Anda"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--neutral-400)',
                                    padding: '0.25rem',
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Masuk
                            </>
                        )}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--neutral-200)',
                }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                        Belum punya akun?{' '}
                        <Link href="/register" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
                            Daftar di sini
                        </Link>
                    </p>
                </div>

                <div style={{
                    textAlign: 'center',
                    marginTop: '1rem',
                    fontSize: '0.75rem',
                    color: 'var(--neutral-400)',
                }}>
                    © 2026 SMA Negeri 1 Limboto — Media Pembelajaran Sejarah
                </div>
            </div>
        </div>
    )
}
