'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, BookOpen, ClipboardList, Award, FolderOpen, Users, FileSpreadsheet, Upload, FileText, X, BookText, CalendarRange } from 'lucide-react'
import Link from 'next/link'
import { TINGKAT_OPTIONS, SEMESTER_OPTIONS, getKelasOptions, getMapelOptions } from '@/lib/constants'

const TP_OPTIONS = [
    { value: 'TP1', label: 'TP 1' },
    { value: 'TP2', label: 'TP 2' },
    { value: 'TP3', label: 'TP 3' },
    { value: 'TP4', label: 'TP 4' },
]
const TAHUN_AJARAN_OPTIONS = ['2024/2025', '2025/2026', '2026/2027']

export default function GuruDashboardPage() {
    const router = useRouter()
    const [stats, setStats] = useState({
        totalMateri: 0, totalTugas: 0,
        totalNilai: 0, totalDokumen: 0, totalSiswa: 0
    })
    const [recentTugas, setRecentTugas] = useState<{ id: string; judul: string; nama_kelas: string; mapel: string; deadline: string }[]>([])
    const [nama, setNama] = useState('')
    const [loading, setLoading] = useState(true)

    // Modal state: 'rpp' | 'prota' | 'prosem' | null
    const [activeModal, setActiveModal] = useState<'rpp' | 'prota' | 'prosem' | null>(null)

    // Shared upload form
    const [formJudul, setFormJudul] = useState('')
    const [formTingkat, setFormTingkat] = useState(10)
    const [formKelas, setFormKelas] = useState('X 1')
    const [formMapel, setFormMapel] = useState('Sejarah')
    const [formSemester, setFormSemester] = useState('Ganjil')
    const [formTp, setFormTp] = useState('TP1')
    const [formTahunAjaran, setFormTahunAjaran] = useState('2025/2026')
    const [formFile, setFormFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles')
                .select('nama').eq('id', user.id).single()
            if (profile) setNama(profile.nama)

            const [materi, tugas, nilai, dokumen, siswa] = await Promise.all([
                supabase.from('materi').select('id', { count: 'exact', head: true }),
                supabase.from('tugas').select('id', { count: 'exact', head: true }),
                supabase.from('nilai').select('id', { count: 'exact', head: true }),
                supabase.from('dokumen_guru').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'siswa'),
            ])

            setStats({
                totalMateri: materi.count || 0,
                totalTugas: tugas.count || 0,
                totalNilai: nilai.count || 0,
                totalDokumen: dokumen.count || 0,
                totalSiswa: siswa.count || 0,
            })

            const { data: recent } = await supabase.from('tugas')
                .select('id, judul, nama_kelas, mapel, deadline')
                .order('created_at', { ascending: false }).limit(5)
            setRecentTugas(recent || [])
            setLoading(false)
        }
        fetchData()
    }, [])

    const openModal = (type: 'rpp' | 'prota' | 'prosem') => {
        setFormJudul('')
        setFormFile(null)
        setFormTingkat(10)
        setFormKelas('X 1')
        setFormMapel('Sejarah')
        setFormSemester('Ganjil')
        setFormTp('TP1')
        setFormTahunAjaran('2025/2026')
        setActiveModal(type)
    }

    const handleTingkatChange = (val: number) => {
        setFormTingkat(val)
        setFormKelas(getKelasOptions(val)[0])
        setFormMapel(getMapelOptions(val)[0].value)
    }

    const handleUpload = async () => {
        if (!formFile || !formJudul || !activeModal) return
        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const filePath = `${user.id}/${Date.now()}_${formFile.name}`
            const { error } = await supabase.storage.from('dokumen').upload(filePath, formFile)
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from('dokumen').getPublicUrl(filePath)
            await supabase.from('dokumen_guru').insert({
                judul: formJudul, tipe: activeModal,
                file_url: publicUrl, file_name: formFile.name,
                tingkat: formTingkat, nama_kelas: formKelas,
                mapel: formMapel, semester: formSemester,
                tahun_ajaran: formTahunAjaran,
                tp: activeModal === 'rpp' ? formTp : null,
                created_by: user.id,
            })
            const redirectTo = activeModal === 'rpp' ? '/guru/rpp' : '/guru/dokumen'
            setActiveModal(null)
            router.push(redirectTo)
        } catch (err) {
            console.error('Upload error:', err)
            alert('Gagal mengupload dokumen')
        } finally {
            setUploading(false)
        }
    }

    const getModalTitle = () => {
        if (activeModal === 'prota') return 'Upload Prota'
        if (activeModal === 'prosem') return 'Upload Prosem'
        return 'Upload RPP'
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><BarChart3 size={28} /> Dashboard Guru</h1>
                    <p className="page-subtitle">Selamat datang, {nama}! 👋</p>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { icon: <BookOpen size={24} />, value: stats.totalMateri, label: 'Total Materi', bg: 'var(--primary-100)', color: 'var(--primary-600)' },
                    { icon: <ClipboardList size={24} />, value: stats.totalTugas, label: 'Total Tugas', bg: 'var(--warning-light)', color: 'var(--warning)' },
                    { icon: <Award size={24} />, value: stats.totalNilai, label: 'Nilai Diinput', bg: 'var(--success-light)', color: 'var(--success)' },
                    { icon: <FolderOpen size={24} />, value: stats.totalDokumen, label: 'Dokumen', bg: 'var(--accent-50)', color: 'var(--accent-600)' },
                    { icon: <Users size={24} />, value: stats.totalSiswa, label: 'Total Siswa', bg: 'var(--info-light)', color: 'var(--info)' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--secondary-800)' }}>Aksi Cepat</h2>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => openModal('rpp')}>
                        <FileSpreadsheet size={16} /> Upload RPP
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal('prota')}>
                        <BookText size={16} /> Upload Prota
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal('prosem')}>
                        <CalendarRange size={16} /> Upload Prosem
                    </button>
                    <Link href="/guru/materi" className="btn btn-outline"><BookOpen size={16} /> Upload Materi</Link>
                    <Link href="/guru/tugas" className="btn btn-outline"><ClipboardList size={16} /> Buat Tugas</Link>
                    <Link href="/guru/nilai" className="btn btn-outline"><Award size={16} /> Input Nilai</Link>
                </div>
            </div>

            {/* Recent Tugas */}
            <div className="card">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--secondary-800)' }}>Tugas Terbaru</h2>
                {recentTugas.length === 0 ? (
                    <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: '1rem' }}>Belum ada tugas</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Judul</th>
                                    <th>Kelas</th>
                                    <th>Mapel</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTugas.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.judul}</td>
                                        <td><span className="badge badge-primary">{t.nama_kelas}</span></td>
                                        <td><span className="badge badge-info">{t.mapel}</span></td>
                                        <td style={{ fontSize: '0.85rem' }}>{new Date(t.deadline).toLocaleDateString('id-ID')}</td>
                                        <td>
                                            <span className={`badge ${new Date(t.deadline) < new Date() ? 'badge-danger' : 'badge-success'}`}>
                                                {new Date(t.deadline) < new Date() ? 'Expired' : 'Aktif'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal (RPP / Prota / Prosem) */}
            {activeModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{getModalTitle()}</h2>
                            <button className="btn btn-ghost" onClick={() => setActiveModal(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Judul {activeModal === 'prota' ? 'Prota' : activeModal === 'prosem' ? 'Prosem' : 'RPP'}</label>
                                <input className="form-input" placeholder={`Masukkan judul ${getModalTitle().replace('Upload ', '')}`}
                                    value={formJudul} onChange={(e) => setFormJudul(e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Tingkat</label>
                                    <select className="form-select" value={formTingkat}
                                        onChange={(e) => handleTingkatChange(Number(e.target.value))}>
                                        {TINGKAT_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mata Pelajaran</label>
                                    <select className="form-select" value={formMapel}
                                        onChange={(e) => setFormMapel(e.target.value)}>
                                        {getMapelOptions(formTingkat).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Semester</label>
                                    <select className="form-select" value={formSemester}
                                        onChange={(e) => setFormSemester(e.target.value)}>
                                        {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                {activeModal === 'rpp' ? (
                                    <div className="form-group">
                                        <label className="form-label">Tujuan Pembelajaran</label>
                                        <select className="form-select" value={formTp}
                                            onChange={(e) => setFormTp(e.target.value)}>
                                            {TP_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Tahun Ajaran</label>
                                        <select className="form-select" value={formTahunAjaran}
                                            onChange={(e) => setFormTahunAjaran(e.target.value)}>
                                            {TAHUN_AJARAN_OPTIONS.map(ta => <option key={ta} value={ta}>{ta}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            {activeModal === 'rpp' && (
                                <div style={{ maxWidth: '50%', margin: '0 auto', textAlign: 'center' }}>
                                    <div className="form-group">
                                        <label className="form-label">Tahun Ajaran</label>
                                        <select className="form-select" value={formTahunAjaran}
                                            onChange={(e) => setFormTahunAjaran(e.target.value)}>
                                            {TAHUN_AJARAN_OPTIONS.map(ta => <option key={ta} value={ta}>{ta}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">File</label>
                                <div className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => { e.preventDefault(); setDragOver(false); setFormFile(e.dataTransfer.files[0]) }}>
                                    {formFile ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={20} /> <span>{formFile.name}</span>
                                            <button className="btn btn-ghost" onClick={() => setFormFile(null)}><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center' }}>
                                            <Upload size={32} style={{ color: 'var(--neutral-300)', marginBottom: '0.5rem' }} />
                                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>Drag & drop atau</p>
                                            <label className="btn btn-outline" style={{ cursor: 'pointer', marginTop: '0.5rem' }}>
                                                Pilih File
                                                <input type="file" hidden onChange={(e) => setFormFile(e.target.files?.[0] || null)} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setActiveModal(null)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !formJudul || !formFile}>
                                {uploading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Mengupload...</> : <><Upload size={16} /> {getModalTitle()}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
