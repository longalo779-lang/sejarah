'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BookOpen, UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TINGKAT_OPTIONS, getKelasOptions } from '@/lib/constants'

export default function RegisterPage() {
    const [nama, setNama] = useState('')
    const [nis, setNis] = useState('')
    const [tingkat, setTingkat] = useState<number>(10)
    const [namaKelas, setNamaKelas] = useState('X 1')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const kelasOptions = getKelasOptions(tingkat)

    const handleTingkatChange = (newTingkat: number) => {
        setTingkat(newTingkat)
        const options = getKelasOptions(newTingkat)
        setNamaKelas(options[0] || '')
    }

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
        if (!nama.trim() || !nis.trim()) {
            setError('Nama dan NIS wajib diisi')
            return
        }

        setLoading(true)

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        nama: nama.trim(),
                        role: 'siswa',
                        tingkat: tingkat,
                        nama_kelas: namaKelas,
                        nis: nis.trim(),
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
                        Registrasi Berhasil! 🎉
                    </h1>
                    <p style={{ color: 'var(--neutral-500)', marginBottom: '1.5rem' }}>
                        Akun Anda telah dibuat. Mengalihkan ke halaman login...
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
                    <div className="logo-icon">
                        <BookOpen />
                    </div>
                    <h1>Registrasi Siswa</h1>
                    <p>SMA Negeri 1 Limboto — Mata Pelajaran Sejarah</p>
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
                            placeholder="Masukkan nama lengkap"
                            value={nama} onChange={(e) => setNama(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="nis">NIS</label>
                        <input id="nis" type="text" className="form-input"
                            placeholder="Nomor Induk Siswa"
                            value={nis} onChange={(e) => setNis(e.target.value)} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="tingkat">Tingkat</label>
                            <select id="tingkat" className="form-select"
                                value={tingkat} onChange={(e) => handleTingkatChange(Number(e.target.value))}>
                                {TINGKAT_OPTIONS.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="kelas">Kelas</label>
                            <select id="kelas" className="form-select"
                                value={namaKelas} onChange={(e) => setNamaKelas(e.target.value)}>
                                {kelasOptions.map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input id="email" type="email" className="form-input"
                            placeholder="Masukkan email"
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
                            <><UserPlus size={18} /> Daftar Sekarang</>
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
                        Seorang guru?{' '}
                        <Link href="/register/guru" style={{ color: 'var(--primary-600)', fontWeight: 500, textDecoration: 'none' }}>
                            Daftar sebagai Guru
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
