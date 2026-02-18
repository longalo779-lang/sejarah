'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, GraduationCap, Users, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { GURU_ACCESS_CODE } from '@/lib/constants'

type LoginMode = 'siswa' | 'guru-nip' | 'guru-email'

export default function LoginPage() {
    const [mode, setMode] = useState<LoginMode>('siswa')
    const [email, setEmail] = useState('')
    const [nip, setNip] = useState('')
    const [kodeAkses, setKodeAkses] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const resetFields = () => {
        setEmail(''); setNip(''); setKodeAkses(''); setPassword('')
        setError('')
    }

    const handleModeChange = (newMode: LoginMode) => {
        setMode(newMode)
        resetFields()
    }

    const loginWithEmail = async (loginEmail: string) => {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: loginEmail.trim(),
            password,
        })

        if (authError) throw authError

        if (data.user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

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
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (mode === 'siswa') {
                // Siswa: login dengan email + password
                await loginWithEmail(email)

            } else if (mode === 'guru-nip') {
                // Guru dengan NIP: cari email via RPC function (SECURITY DEFINER bypasses RLS)
                if (!nip.trim()) {
                    setError('NIP wajib diisi')
                    return
                }

                const { data: emailResult, error: rpcError } = await supabase
                    .rpc('get_email_by_nip', { nip_input: nip.trim() })

                console.log('RPC result:', { emailResult, rpcError })

                if (rpcError) {
                    console.error('RPC error:', rpcError)
                    if (rpcError.message?.includes('function') || rpcError.code === '42883') {
                        setError('Fungsi lookup NIP belum tersedia. Hubungi administrator.')
                    } else {
                        setError('NIP tidak ditemukan. Pastikan NIP Anda sudah terdaftar.')
                    }
                    return
                }

                if (!emailResult) {
                    setError('NIP tidak ditemukan. Pastikan NIP Anda sudah terdaftar.')
                    return
                }

                await loginWithEmail(emailResult)

            } else if (mode === 'guru-email') {
                // Guru tanpa NIP: login dengan email + kode akses + password
                if (!kodeAkses.trim()) {
                    setError('Kode akses wajib diisi')
                    return
                }
                if (kodeAkses.trim() !== GURU_ACCESS_CODE) {
                    setError('Kode akses tidak valid. Hubungi admin untuk kode akses yang benar.')
                    return
                }

                await loginWithEmail(email)
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Login gagal. Periksa data login Anda.'
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

                {/* Mode Tabs */}
                <div style={{
                    display: 'flex', gap: '0.35rem', marginBottom: '1.25rem',
                    background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)',
                    padding: '0.3rem', border: '1px solid rgba(0,0,0,0.1)',
                }}>
                    <button type="button" onClick={() => handleModeChange('siswa')}
                        style={{
                            flex: 1, padding: '0.6rem 0.25rem', fontSize: '0.8rem', fontWeight: 700,
                            border: 'none', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                            background: mode === 'siswa' ? 'var(--primary-600)' : 'rgba(255,255,255,0.7)',
                            color: mode === 'siswa' ? 'white' : '#1a1a1a',
                            boxShadow: mode === 'siswa' ? '0 2px 6px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                        }}>
                        <Users size={14} /> Siswa
                    </button>
                    <button type="button" onClick={() => handleModeChange('guru-nip')}
                        style={{
                            flex: 1, padding: '0.6rem 0.25rem', fontSize: '0.8rem', fontWeight: 700,
                            border: 'none', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                            background: mode === 'guru-nip' ? 'var(--primary-600)' : 'rgba(255,255,255,0.7)',
                            color: mode === 'guru-nip' ? 'white' : '#1a1a1a',
                            boxShadow: mode === 'guru-nip' ? '0 2px 6px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                        }}>
                        <GraduationCap size={14} /> Guru (NIP)
                    </button>
                    <button type="button" onClick={() => handleModeChange('guru-email')}
                        style={{
                            flex: 1, padding: '0.6rem 0.25rem', fontSize: '0.8rem', fontWeight: 700,
                            border: 'none', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                            background: mode === 'guru-email' ? 'var(--primary-600)' : 'rgba(255,255,255,0.7)',
                            color: mode === 'guru-email' ? 'white' : '#1a1a1a',
                            boxShadow: mode === 'guru-email' ? '0 2px 6px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                        }}>
                        <KeyRound size={14} /> Kode Akses
                    </button>
                </div>

                <form onSubmit={handleLogin}>
                    {error && (
                        <div style={{
                            background: 'var(--accent-50)', color: 'var(--accent-700)',
                            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                            fontSize: '0.875rem', marginBottom: '1.25rem',
                            border: '1px solid var(--accent-200)'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* SISWA: Email */}
                    {mode === 'siswa' && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <input id="email" type="email" className="form-input"
                                placeholder="Masukkan email siswa"
                                value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    )}

                    {/* GURU NIP: NIP field */}
                    {mode === 'guru-nip' && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="nip">NIP</label>
                            <input id="nip" type="text" className="form-input"
                                placeholder="Masukkan NIP guru"
                                value={nip} onChange={(e) => setNip(e.target.value)} required />
                        </div>
                    )}

                    {/* GURU EMAIL: Email + Kode Akses */}
                    {mode === 'guru-email' && (
                        <>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email2">Email</label>
                                <input id="email2" type="email" className="form-input"
                                    placeholder="Masukkan email guru"
                                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="kodeAkses">Kode Akses</label>
                                <input id="kodeAkses" type="text" className="form-input"
                                    placeholder="Masukkan kode akses dari admin"
                                    value={kodeAkses} onChange={(e) => setKodeAkses(e.target.value)} required />
                            </div>
                        </>
                    )}

                    {/* Password (semua mode) */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input id="password" type={showPassword ? 'text' : 'password'}
                                className="form-input" placeholder="Masukkan password"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                required style={{ paddingRight: '3rem' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', padding: '0.25rem',
                                }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg btn-block"
                        disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? (
                            <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Memproses...</>
                        ) : (
                            <><LogIn size={18} /> Masuk</>
                        )}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem',
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
                    textAlign: 'center', marginTop: '1rem',
                    fontSize: '0.75rem', color: 'var(--neutral-400)',
                }}>
                    © 2026 SMA Negeri 1 Limboto — Media Pembelajaran Sejarah
                </div>
            </div>
        </div>
    )
}
