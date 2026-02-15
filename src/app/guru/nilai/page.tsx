'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award } from 'lucide-react'
import { TINGKAT_OPTIONS, SEMESTER_OPTIONS, TP_OPTIONS, getKelasOptions, getMapelOptions } from '@/lib/constants'

interface GradedItem {
    id: string
    siswa_id: string
    nilai: number | null
    checked: boolean
    checked_at: string | null
    submitted_at: string
    file_name: string
    tugas: {
        judul: string
        tingkat: number
        nama_kelas: string
        mapel: string
        semester: string
        tp: string | null
        kategori: string
    }
    profiles: {
        nama: string
        nis: string
        nama_kelas: string
    }
}

export default function GuruNilaiPage() {
    const [dataList, setDataList] = useState<GradedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filterTingkat, setFilterTingkat] = useState<number>(10)
    const [filterKelas, setFilterKelas] = useState('')
    const [filterMapel, setFilterMapel] = useState('')
    const [filterSemester, setFilterSemester] = useState('Ganjil')
    const [filterTp, setFilterTp] = useState('')
    const [filterKategori, setFilterKategori] = useState('')

    const supabase = createClient()

    const fetchData = async () => {
        setLoading(true)
        // Read directly from tugas_submissions joined with tugas
        let query = supabase.from('tugas_submissions')
            .select('id, siswa_id, nilai, checked, checked_at, submitted_at, file_name, tugas!inner(judul, tingkat, nama_kelas, mapel, semester, tp, kategori), profiles(nama, nis, nama_kelas)')
            .eq('checked', true)
            .not('nilai', 'is', null)
            .eq('tugas.tingkat', filterTingkat)
            .eq('tugas.semester', filterSemester)
            .order('checked_at', { ascending: false })

        if (filterKelas) query = query.eq('tugas.nama_kelas', filterKelas)
        if (filterMapel) query = query.eq('tugas.mapel', filterMapel)
        if (filterTp) query = query.eq('tugas.tp', filterTp)
        if (filterKategori) query = query.eq('tugas.kategori', filterKategori)

        const { data, error } = await query
        if (error) console.error('Fetch error:', error)
        setDataList((data as any) || [])
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [filterTingkat, filterKelas, filterMapel, filterSemester, filterTp, filterKategori])

    const getNilaiBadge = (n: number) => {
        if (n >= 90) return 'badge-success'
        if (n >= 75) return 'badge-primary'
        if (n >= 60) return 'badge-warning'
        return 'badge-danger'
    }

    // Helper to safely access tugas fields (could be object or array from supabase)
    const getTugas = (item: GradedItem) => {
        const t = item.tugas as any
        if (Array.isArray(t)) return t[0] || {}
        return t || {}
    }

    const getProfile = (item: GradedItem) => {
        const p = item.profiles as any
        if (Array.isArray(p)) return p[0] || {}
        return p || {}
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Award size={28} /> Nilai Siswa</h1>
                    <p className="page-subtitle">History penilaian dari tugas, ulangan, UTS, UAS & praktik</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                        <label className="form-label">Tingkat</label>
                        <select className="form-select" value={filterTingkat}
                            onChange={(e) => { setFilterTingkat(Number(e.target.value)); setFilterKelas('') }}>
                            {TINGKAT_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                        <label className="form-label">Kelas</label>
                        <select className="form-select" value={filterKelas}
                            onChange={(e) => setFilterKelas(e.target.value)}>
                            <option value="">Semua</option>
                            {getKelasOptions(filterTingkat).map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                        <label className="form-label">Mapel</label>
                        <select className="form-select" value={filterMapel}
                            onChange={(e) => setFilterMapel(e.target.value)}>
                            <option value="">Semua</option>
                            {getMapelOptions(filterTingkat).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                        <label className="form-label">Semester</label>
                        <select className="form-select" value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}>
                            {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                    <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
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
                </div>
            </div>

            {/* History Penilaian Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : dataList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Award size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--neutral-500)' }}>Belum ada data nilai</p>
                    <p style={{ color: 'var(--neutral-400)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Nilai akan muncul otomatis setelah guru memberi nilai di halaman Tugas
                    </p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary-800)', marginBottom: '1rem', padding: '1rem 1rem 0' }}>
                        📋 History Penilaian ({dataList.length} data)
                    </h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '40px' }}>No</th>
                                <th style={{ minWidth: '140px' }}>Nama Siswa</th>
                                <th style={{ minWidth: '60px' }}>Tingkat</th>
                                <th style={{ minWidth: '80px' }}>Kelas</th>
                                <th style={{ minWidth: '100px' }}>Kategori</th>
                                <th style={{ minWidth: '120px' }}>Judul</th>
                                <th style={{ minWidth: '60px' }}>Nilai</th>
                                <th style={{ minWidth: '60px' }}>TP</th>
                                <th style={{ minWidth: '100px' }}>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataList.map((item, idx) => {
                                const tugas = getTugas(item)
                                const profile = getProfile(item)
                                return (
                                    <tr key={item.id}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <strong>{profile.nama || '-'}</strong>
                                            <br /><small style={{ color: 'var(--neutral-400)' }}>{profile.nis || '-'}</small>
                                        </td>
                                        <td><span className="badge badge-info">Kelas {tugas.tingkat}</span></td>
                                        <td>{tugas.nama_kelas || profile.nama_kelas || '-'}</td>
                                        <td><span className="badge" style={{ background: 'var(--secondary-100)', color: 'var(--secondary-700)' }}>{tugas.kategori || '-'}</span></td>
                                        <td>{tugas.judul || '-'}</td>
                                        <td>
                                            {item.nilai !== null ? (
                                                <span className={`badge ${getNilaiBadge(item.nilai)}`}>{item.nilai}</span>
                                            ) : '-'}
                                        </td>
                                        <td>{tugas.tp ? <span className="badge badge-success">{tugas.tp}</span> : '-'}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--neutral-400)' }}>
                                            {item.checked_at ? new Date(item.checked_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Rekap Penilaian */}
            {!loading && dataList.length > 0 && (() => {
                const KATEGORIS = ['Tugas', 'Ulangan Harian', 'UTS', 'UAS', 'Praktik'] as const
                const siswaMap: Record<string, {
                    nama: string; nis: string; nama_kelas: string; tingkat: number
                    tp: string; semester: string
                    grades: Record<string, number[]>
                }> = {}

                dataList.forEach(item => {
                    const tugas = getTugas(item)
                    const profile = getProfile(item)
                    if (item.nilai === null) return
                    const key = `${item.siswa_id}_${tugas.tp || '-'}`
                    if (!siswaMap[key]) {
                        siswaMap[key] = {
                            nama: profile.nama || '-',
                            nis: profile.nis || '-',
                            nama_kelas: tugas.nama_kelas || profile.nama_kelas || '-',
                            tingkat: tugas.tingkat,
                            tp: tugas.tp || '-',
                            semester: tugas.semester || '-',
                            grades: {}
                        }
                    }
                    const kat = tugas.kategori || 'Tugas'
                    if (!siswaMap[key].grades[kat]) {
                        siswaMap[key].grades[kat] = []
                    }
                    siswaMap[key].grades[kat].push(item.nilai)
                })

                const rekapRows = Object.values(siswaMap).sort((a, b) => a.nama.localeCompare(b.nama))

                const avg = (arr: number[] | undefined) => {
                    if (!arr || arr.length === 0) return null
                    return arr.reduce((s, v) => s + v, 0) / arr.length
                }

                const fmtAvg = (val: number | null) => val !== null ? val.toFixed(1) : '-'

                if (rekapRows.length === 0) return null

                return (
                    <div style={{ marginTop: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary-800)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📊 Rekap Penilaian
                        </h2>
                        <div className="card" style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '40px' }}>No</th>
                                        <th style={{ minWidth: '150px' }}>Nama Siswa</th>
                                        <th style={{ minWidth: '80px' }}>Kelas</th>
                                        <th style={{ minWidth: '60px' }}>TP</th>
                                        <th style={{ minWidth: '80px' }}>Semester</th>
                                        {KATEGORIS.map(k => (
                                            <th key={k} style={{ minWidth: '80px', textAlign: 'center' }}>{k}</th>
                                        ))}
                                        <th style={{ minWidth: '90px', textAlign: 'center' }}>Rata-Rata</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rekapRows.map((row, idx) => {
                                        const allGrades: number[] = []
                                        KATEGORIS.forEach(k => {
                                            const g = row.grades[k]
                                            if (g) allGrades.push(...g)
                                        })
                                        const overallAvg = avg(allGrades)

                                        return (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <strong>{row.nama}</strong>
                                                    <br /><small style={{ color: 'var(--neutral-400)' }}>{row.nis}</small>
                                                </td>
                                                <td>{row.nama_kelas}</td>
                                                <td><span className="badge badge-success">{row.tp}</span></td>
                                                <td><span className="badge badge-warning">Smt {row.semester}</span></td>
                                                {KATEGORIS.map(k => {
                                                    const categoryAvg = avg(row.grades[k])
                                                    const count = row.grades[k]?.length || 0
                                                    return (
                                                        <td key={k} style={{ textAlign: 'center' }}>
                                                            {categoryAvg !== null ? (
                                                                <div>
                                                                    <span className={`badge ${getNilaiBadge(categoryAvg)}`}>
                                                                        {fmtAvg(categoryAvg)}
                                                                    </span>
                                                                    <br /><small style={{ color: 'var(--neutral-400)', fontSize: '0.65rem' }}>
                                                                        {count} nilai
                                                                    </small>
                                                                </div>
                                                            ) : (
                                                                <span style={{ color: 'var(--neutral-300)' }}>-</span>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                                <td style={{ textAlign: 'center' }}>
                                                    {overallAvg !== null ? (
                                                        <span className={`badge ${getNilaiBadge(overallAvg)}`} style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                                            {fmtAvg(overallAvg)}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
