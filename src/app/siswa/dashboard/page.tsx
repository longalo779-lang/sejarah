'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, BookOpen, ClipboardList, Award, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SiswaDashboardPage() {
    const [nama, setNama] = useState('')
    const [namaKelas, setNamaKelas] = useState('')
    const [stats, setStats] = useState({ totalMateri: 0, pendingTugas: 0, totalNilai: 0 })
    const [pendingTugas, setPendingTugas] = useState<{ id: string; judul: string; mapel: string; deadline: string }[]>([])
    const [recentNilai, setRecentNilai] = useState<{ id: string; judul: string; mapel: string; nilai: number }[]>([])
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(new Date())

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles')
                .select('nama, nama_kelas').eq('id', user.id).single()
            if (profile) {
                setNama(profile.nama)
                setNamaKelas(profile.nama_kelas || '')
            }

            if (!profile?.nama_kelas) { setLoading(false); return }

            // Fetch materi count
            const { count: materiCount } = await supabase.from('materi')
                .select('id', { count: 'exact', head: true })
                .eq('nama_kelas', profile.nama_kelas)

            // Fetch tugas
            const { data: allTugas } = await supabase.from('tugas')
                .select('id, judul, mapel, deadline')
                .eq('nama_kelas', profile.nama_kelas)
                .order('deadline', { ascending: true })

            const { data: submissions } = await supabase.from('tugas_submissions')
                .select('tugas_id').eq('siswa_id', user.id)
            const submittedIds = new Set(submissions?.map(s => s.tugas_id) || [])

            const pending = (allTugas || []).filter(t =>
                !submittedIds.has(t.id) && new Date(t.deadline) > new Date()
            )

            // Fetch recent nilai
            const { data: nilaiData } = await supabase.from('nilai')
                .select('id, judul, mapel, nilai')
                .eq('siswa_id', user.id)
                .order('created_at', { ascending: false }).limit(5)

            const { count: nilaiCount } = await supabase.from('nilai')
                .select('id', { count: 'exact', head: true })
                .eq('siswa_id', user.id)

            setStats({
                totalMateri: materiCount || 0,
                pendingTugas: pending.length,
                totalNilai: nilaiCount || 0,
            })
            setPendingTugas(pending.slice(0, 3))
            setRecentNilai(nilaiData || [])
            setLoading(false)
        }
        fetchData()
    }, [])

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const getCountdown = (deadline: string) => {
        const diff = new Date(deadline).getTime() - now.getTime()
        if (diff <= 0) return 'Waktu habis'
        const d = Math.floor(diff / (1000 * 60 * 60 * 24))
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${d}h ${h}j ${m}m`
    }

    const getNilaiBadge = (n: number) => {
        if (n >= 90) return 'badge-success'
        if (n >= 75) return 'badge-primary'
        if (n >= 60) return 'badge-warning'
        return 'badge-danger'
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><BarChart3 size={28} /> Dashboard Siswa</h1>
                    <p className="page-subtitle">Halo, {nama}! — Kelas {namaKelas} 👋</p>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}><BookOpen size={24} /></div>
                    <div className="stat-value">{stats.totalMateri}</div>
                    <div className="stat-label">Materi Tersedia</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><ClipboardList size={24} /></div>
                    <div className="stat-value">{stats.pendingTugas}</div>
                    <div className="stat-label">Tugas Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><Award size={24} /></div>
                    <div className="stat-value">{stats.totalNilai}</div>
                    <div className="stat-label">Nilai Diinput</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--secondary-800)' }}>Aksi Cepat</h2>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Link href="/siswa/materi" className="btn btn-primary"><BookOpen size={16} /> Lihat Materi</Link>
                    <Link href="/siswa/tugas" className="btn btn-outline"><ClipboardList size={16} /> Kerjakan Tugas</Link>
                    <Link href="/siswa/nilai" className="btn btn-outline"><Award size={16} /> Lihat Nilai</Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {/* Pending Tugas */}
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--secondary-800)' }}>
                        <Clock size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Tugas Menunggu
                    </h2>
                    {pendingTugas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <CheckCircle2 size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>Semua tugas sudah selesai! 🎉</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {pendingTugas.map(t => (
                                <div key={t.id} style={{ padding: '0.75rem', background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-200)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <strong style={{ fontSize: '0.9rem' }}>{t.judul}</strong>
                                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{t.mapel}</span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>
                                        ⏰ {getCountdown(t.deadline)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Nilai */}
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--secondary-800)' }}>
                        <Award size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Nilai Terbaru
                    </h2>
                    {recentNilai.length === 0 ? (
                        <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: '1rem' }}>Belum ada nilai</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {recentNilai.map(n => (
                                <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-200)' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.9rem' }}>{n.judul}</strong>
                                        <br /><span className="badge badge-info" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>{n.mapel}</span>
                                    </div>
                                    <span className={`badge ${getNilaiBadge(n.nilai)}`}>{n.nilai}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
