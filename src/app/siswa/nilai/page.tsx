'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, TrendingUp, BookOpen } from 'lucide-react'
import { SEMESTER_OPTIONS, TP_OPTIONS, getMapelOptions } from '@/lib/constants'

interface NilaiItem {
    id: string; mapel: string; semester: string
    kategori: string; judul: string; nilai: number
    keterangan: string | null; created_at: string
    tingkat?: number; nama_kelas?: string; tp?: string | null
    guru?: { nama: string; avatar_url: string | null }
}

export default function SiswaNilaiPage() {
    const [nilaiList, setNilaiList] = useState<NilaiItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filterSemester, setFilterSemester] = useState('Ganjil')
    const [filterMapel, setFilterMapel] = useState('')
    const [filterKategori, setFilterKategori] = useState('')
    const [filterTp, setFilterTp] = useState('')
    const [namaKelas, setNamaKelas] = useState('')
    const [tingkat, setTingkat] = useState(10)

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles')
                .select('nama_kelas').eq('id', user.id).single()
            if (profile) {
                setNamaKelas(profile.nama_kelas || '')
                const k = profile.nama_kelas || ''
                setTingkat(k.startsWith('XII') ? 12 : k.startsWith('XI') ? 11 : 10)
            }

            let query = supabase.from('nilai').select('*, guru:profiles!nilai_created_by_fkey(nama, avatar_url)')
                .eq('siswa_id', user.id)
                .eq('semester', filterSemester)
                .order('created_at', { ascending: false })
            if (filterMapel) query = query.eq('mapel', filterMapel)
            if (filterKategori) query = query.eq('kategori', filterKategori)
            if (filterTp) query = query.eq('tp', filterTp)
            const { data } = await query
            setNilaiList(data || [])
            setLoading(false)
        }
        fetchData()
    }, [filterSemester, filterMapel, filterKategori, filterTp])

    const avg = nilaiList.length > 0
        ? (nilaiList.reduce((a, b) => a + b.nilai, 0) / nilaiList.length).toFixed(1)
        : '0.0'
    const highest = nilaiList.length > 0 ? Math.max(...nilaiList.map(n => n.nilai)) : 0
    const lowest = nilaiList.length > 0 ? Math.min(...nilaiList.map(n => n.nilai)) : 0

    const getNilaiBadge = (n: number) => {
        if (n >= 90) return 'badge-success'
        if (n >= 75) return 'badge-primary'
        if (n >= 60) return 'badge-warning'
        return 'badge-danger'
    }

    const getFeedback = (n: number) => {
        if (n >= 90) return 'Sangat Baik 🌟'
        if (n >= 75) return 'Baik 👍'
        if (n >= 60) return 'Cukup 📝'
        return 'Perlu Peningkatan 💪'
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Award size={28} /> Nilai Saya</h1>
                    <p className="page-subtitle">Kelas {namaKelas}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                        <label className="form-label">Semester</label>
                        <select className="form-select" value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}>
                            {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                        <label className="form-label">Mapel</label>
                        <select className="form-select" value={filterMapel}
                            onChange={(e) => setFilterMapel(e.target.value)}>
                            {tingkat > 10 && <option value="">Semua</option>}
                            {getMapelOptions(tingkat).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '140px', marginBottom: 0 }}>
                        <label className="form-label">Kategori</label>
                        <select className="form-select" value={filterKategori}
                            onChange={(e) => setFilterKategori(e.target.value)}>
                            <option value="">Semua</option>
                            <option value="Tugas">Tugas</option>
                            <option value="Ulangan Harian">Ulangan Harian</option>
                            <option value="UTS">UTS</option>
                            <option value="UAS">UAS</option>
                            <option value="Praktik">Praktik</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                        <label className="form-label">TP</label>
                        <select className="form-select" value={filterTp}
                            onChange={(e) => setFilterTp(e.target.value)}>
                            <option value="">Semua</option>
                            {TP_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-value">{avg}</div>
                    <div className="stat-label">Rata-rata</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                        <Award size={24} />
                    </div>
                    <div className="stat-value">{highest}</div>
                    <div className="stat-label">Tertinggi</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--accent-50)', color: 'var(--accent-600)' }}>
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-value">{lowest}</div>
                    <div className="stat-label">Terendah</div>
                </div>
            </div>

            {/* Nilai Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : nilaiList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Award size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--neutral-500)' }}>Belum ada nilai</p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Mapel</th>
                                <th>Kategori</th>
                                <th>Judul</th>
                                <th>Kelas</th>
                                <th>TP</th>
                                <th>Nilai</th>
                                <th>Guru</th>
                                <th>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nilaiList.map(n => (
                                <tr key={n.id}>
                                    <td><span className="badge badge-info">{n.mapel}</span></td>
                                    <td>{n.kategori}</td>
                                    <td>{n.judul}</td>
                                    <td>{n.nama_kelas || namaKelas}</td>
                                    <td>{n.tp ? <span className="badge badge-success">{n.tp}</span> : '-'}</td>
                                    <td><span className={`badge ${getNilaiBadge(n.nilai)}`}>{n.nilai}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {n.guru?.avatar_url ? (
                                                <img src={n.guru.avatar_url} alt={n.guru.nama}
                                                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{
                                                    width: '22px', height: '22px', borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '0.55rem', fontWeight: 700,
                                                }}>
                                                    {(n.guru?.nama || 'G').split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                </div>
                                            )}
                                            <span style={{ fontSize: '0.8rem' }}>{n.guru?.nama || 'Guru'}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--neutral-400)' }}>
                                        {new Date(n.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding: '1rem', textAlign: 'right', borderTop: '1px solid var(--neutral-200)', fontWeight: 600 }}>
                        Rata-rata: <span className={`badge ${getNilaiBadge(parseFloat(avg))}`}>{avg}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
