'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { GraduationCap, UserPlus, Eye, EyeOff, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { ALLOWED_NIP_LIST, GURU_ACCESS_CODE } from '@/lib/constants'

export default function RegisterGuruPage() {
    const [nama, setNama] = useState('')
    const [nip, setNip] = useState('')
    const [kodeAkses, setKodeAkses] = useState('')
    const [tanpaNip, setTanpaNip] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Password minimal 6 karakter')
            return
        }
        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok')
            return
        }
        if (!nama.trim()) {
            setError('Nama lengkap wajib diisi')
            return
        }

        // Validasi NIP atau Kode Akses
        if (tanpaNip) {
            if (kodeAkses.trim() !== GURU_ACCESS_CODE) {
                setError('Kode akses tidak valid. Hubungi admin untuk mendapatkan kode akses.')
                return
            }
        } else {
            if (!nip.trim()) {
                setError('NIP wajib diisi')
                return
            }
            if (!ALLOWED_NIP_LIST.includes(nip.trim())) {
                setError('NIP tidak terdaftar dalam sistem. Pastikan NIP Anda benar atau gunakan kode akses.')
                return
            }
        }

        setLoading(true)

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        nama: nama.trim(),
                        role: 'guru',
                        nis: nip.trim() || null,
                        nip: nip.trim() || null,
                    },
                },
            })

            if (signUpError) {
                console.error('Signup error:', signUpError)
                throw signUpError
            }

            if (data.user) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Registrasi gagal. Coba lagi.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 80, height: 80,
                        background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        animation: 'slideUp 0.6s ease-out',
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--secondary-800)' }}>
                        Registrasi Guru Berhasil! 🎉
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', marginBottom: '1.5rem' }}>
                        Akun guru Anda telah dibuat. Mengalihkan ke halaman login...
                    </p>
                    <Link href="/login" className="btn btn-primary btn-lg btn-block">
                        <ArrowLeft size={18} /> Ke Halaman Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <div className="logo-icon" style={{ background: 'linear-gradient(135deg, var(--secondary-600), var(--secondary-800))' }}>
                        <GraduationCap />
                    </div>
                    <h1>Registrasi Guru</h1>
                    <p>SMA Negeri 1 Limboto — Mata Pelajaran Sejarah</p>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'var(--primary-50)', padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem',
                    fontSize: '0.8rem', color: 'var(--primary-800)',
                    border: '1px solid var(--primary-200)',
                }}>
                    <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                    Registrasi memerlukan NIP valid atau kode akses dari admin
                </div>

                <form onSubmit={handleRegister}>
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

                    <div className="form-group">
                        <label className="form-label" htmlFor="nama">Nama Lengkap</label>
                        <input id="nama" type="text" className="form-input"
                            placeholder="Masukkan nama lengkap guru"
                            value={nama} onChange={(e) => setNama(e.target.value)} required />
                    </div>

                    {/* Toggle NIP / Kode Akses */}
                    <div style={{
                        display: 'flex', gap: '0.5rem', marginBottom: '0.75rem',
                    }}>
                        <button type="button" onClick={() => setTanpaNip(false)}
                            className={`btn ${!tanpaNip ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>
                            Punya NIP
                        </button>
                        <button type="button" onClick={() => setTanpaNip(true)}
                            className={`btn ${tanpaNip ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>
                            <KeyRound size={14} /> Kode Akses
                        </button>
                    </div>

                    {!tanpaNip ? (
                        <div className="form-group">
                            <label className="form-label" htmlFor="nip">NIP</label>
                            <input id="nip" type="text" className="form-input"
                                placeholder="Masukkan NIP (wajib)"
                                value={nip} onChange={(e) => setNip(e.target.value)} required />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label" htmlFor="kodeAkses">Kode Akses</label>
                            <input id="kodeAkses" type="text" className="form-input"
                                placeholder="Masukkan kode akses dari admin"
                                value={kodeAkses} onChange={(e) => setKodeAkses(e.target.value)} required />
                            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: '0.25rem' }}>
                                Hubungi admin untuk mendapatkan kode akses
                            </p>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input id="email" type="email" className="form-input"
                            placeholder="Masukkan email guru"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input id="password" type={showPassword ? 'text' : 'password'} className="form-input"
                                placeholder="Minimal 6 karakter"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                required minLength={6} style={{ paddingRight: '3rem' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', padding: '0.25rem'
                                }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">Konfirmasi Password</label>
                        <input id="confirmPassword" type={showPassword ? 'text' : 'password'} className="form-input"
                            placeholder="Ulangi password"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg btn-block"
                        disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? (
                            <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Mendaftar...</>
                        ) : (
                            <><UserPlus size={18} /> Daftar sebagai Guru</>
                        )}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem',
                    borderTop: '1px solid var(--neutral-200)'
                }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                        Sudah punya akun?{' '}
                        <Link href="/login" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
                            Masuk di sini
                        </Link>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', marginTop: '0.5rem' }}>
                        Bukan guru?{' '}
                        <Link href="/register" style={{ color: 'var(--primary-600)', fontWeight: 500, textDecoration: 'none' }}>
                            Daftar sebagai Siswa
                        </Link>
                    </p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                    © 2026 SMA Negeri 1 Limboto — Media Pembelajaran Sejarah
                </div>
            </div>
        </div>
    )
}
