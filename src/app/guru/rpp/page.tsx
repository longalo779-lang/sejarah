'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileSpreadsheet, Upload, Trash2, Download, X, FileText } from 'lucide-react'
import { TINGKAT_OPTIONS, SEMESTER_OPTIONS, getKelasOptions, getMapelOptions } from '@/lib/constants'

interface RPPItem {
    id: string; judul: string; tipe: string
    file_url: string; file_name: string
    tingkat: number; nama_kelas: string; mapel: string
    semester: string; tahun_ajaran: string; tp: string | null
    created_at: string
}

const TP_OPTIONS = [
    { value: 'TP1', label: 'TP 1' },
    { value: 'TP2', label: 'TP 2' },
    { value: 'TP3', label: 'TP 3' },
    { value: 'TP4', label: 'TP 4' },
]

const TAHUN_AJARAN_OPTIONS = ['2024/2025', '2025/2026', '2026/2027']

export default function GuruRPPPage() {
    const [rppList, setRppList] = useState<RPPItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    // Filters
    const [filterTingkat, setFilterTingkat] = useState<number>(10)
    const [filterKelas, setFilterKelas] = useState('')
    const [filterMapel, setFilterMapel] = useState('')
    const [filterSemester, setFilterSemester] = useState('Ganjil')
    const [filterTahunAjaran, setFilterTahunAjaran] = useState('2025/2026')
    const [filterTP, setFilterTP] = useState('')

    // Form
    const [judul, setJudul] = useState('')
    const [tingkat, setTingkat] = useState(10)
    const [namaKelas, setNamaKelas] = useState('X 1')
    const [mapel, setMapel] = useState('Sejarah')
    const [semester, setSemester] = useState('Ganjil')
    const [tahunAjaran, setTahunAjaran] = useState('2025/2026')
    const [tp, setTp] = useState('TP1')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)

    const supabase = createClient()

    const fetchRPP = async () => {
        setLoading(true)
        let query = supabase.from('dokumen_guru').select('*')
            .eq('tipe', 'rpp')
            .eq('tingkat', filterTingkat)
            .eq('semester', filterSemester)
            .eq('tahun_ajaran', filterTahunAjaran)
            .order('created_at', { ascending: false })
        if (filterKelas) query = query.eq('nama_kelas', filterKelas)
        if (filterMapel) query = query.eq('mapel', filterMapel)
        if (filterTP) query = query.eq('tp', filterTP)
        const { data } = await query
        setRppList(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchRPP() }, [filterTingkat, filterKelas, filterMapel, filterSemester, filterTahunAjaran, filterTP])

    const handleTingkatChange = (val: number) => {
        setTingkat(val)
        setNamaKelas(getKelasOptions(val)[0])
        setMapel(getMapelOptions(val)[0].value)
    }

    const handleUpload = async () => {
        if (!file || !judul) return
        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const filePath = `${user.id}/${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage.from('dokumen').upload(filePath, file)
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('dokumen').getPublicUrl(filePath)
            await supabase.from('dokumen_guru').insert({
                judul, tipe: 'rpp',
                file_url: publicUrl, file_name: file.name,
                tingkat, nama_kelas: namaKelas,
                mapel, semester, tahun_ajaran: tahunAjaran,
                tp,
                created_by: user.id,
            })
            setShowModal(false)
            setJudul(''); setFile(null)
            fetchRPP()
        } catch (err) {
            console.error('Upload error:', err)
            alert('Gagal mengupload RPP')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string, fileUrl: string) => {
        if (!confirm('Hapus RPP ini?')) return
        try {
            const path = fileUrl.split('/storage/v1/object/public/dokumen/')[1]
            if (path) await supabase.storage.from('dokumen').remove([path])
            await supabase.from('dokumen_guru').delete().eq('id', id)
            fetchRPP()
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    const quickUpload = (tpValue: string) => {
        setTp(tpValue)
        setJudul('')
        setFile(null)
        setShowModal(true)
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FileSpreadsheet size={28} /> RPP</h1>
                    <p className="page-subtitle">Kelola Rencana Pelaksanaan Pembelajaran</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Upload size={16} /> Upload RPP
                </button>
            </div>

            {/* TP Cards with Quick Upload */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setFilterTP('')}
                    className="card" style={{
                        flex: 1, cursor: 'pointer', textAlign: 'center', padding: '0.75rem 1rem',
                        border: filterTP === '' ? '2px solid var(--primary-500)' : '1px solid var(--neutral-100)',
                        background: filterTP === '' ? 'var(--primary-50)' : 'white',
                        transition: 'all 0.2s ease',
                    }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: filterTP === '' ? 'var(--primary-700)' : 'var(--neutral-700)' }}>Semua TP</div>
                </button>
                {TP_OPTIONS.map(t => {
                    const isActive = filterTP === t.value
                    return (
                        <button key={t.value} onClick={() => setFilterTP(t.value)}
                            className="card" style={{
                                flex: 1, cursor: 'pointer', textAlign: 'center', padding: '0.75rem 1rem',
                                border: isActive ? '2px solid var(--primary-500)' : '1px solid var(--neutral-100)',
                                background: isActive ? 'var(--primary-50)' : 'white',
                                transition: 'all 0.2s ease',
                            }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isActive ? 'var(--primary-700)' : 'var(--neutral-700)' }}>{t.label}</div>
                            <div style={{ fontSize: '0.7rem', color: isActive ? 'var(--primary-500)' : 'var(--neutral-400)', marginTop: '0.125rem' }}>
                                Tujuan Pembelajaran {t.value.replace('TP', '')}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '90px', marginBottom: 0 }}>
                        <label className="form-label">Tingkat</label>
                        <select className="form-select" value={filterTingkat}
                            onChange={(e) => { setFilterTingkat(Number(e.target.value)); setFilterKelas('') }}>
                            {TINGKAT_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
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
                    <div className="form-group" style={{ flex: 1, minWidth: '90px', marginBottom: 0 }}>
                        <label className="form-label">Semester</label>
                        <select className="form-select" value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}>
                            {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                        <label className="form-label">Tahun Ajaran</label>
                        <select className="form-select" value={filterTahunAjaran}
                            onChange={(e) => setFilterTahunAjaran(e.target.value)}>
                            {TAHUN_AJARAN_OPTIONS.map(ta => <option key={ta} value={ta}>{ta}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* RPP Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : rppList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FileSpreadsheet size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--neutral-500)' }}>Belum ada RPP</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {rppList.map(d => (
                        <div key={d.id} className="card card-hover">
                            <div style={{ marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--secondary-800)', marginBottom: '0.5rem' }}>{d.judul}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="badge badge-primary">{d.nama_kelas}</span>
                                    <span className="badge badge-info">{d.mapel}</span>
                                    <span className="badge badge-warning">Smt {d.semester}</span>
                                    {d.tp && <span className="badge badge-success">{d.tp}</span>}
                                </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: '0.5rem' }}>📅 TA {d.tahun_ajaran}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginBottom: '1rem' }}>
                                📄 {d.file_name} • {new Date(d.created_at).toLocaleDateString('id-ID')}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <a href={d.file_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem' }}>
                                    <Download size={14} /> Download
                                </a>
                                <button className="btn btn-danger" style={{ fontSize: '0.8rem' }} onClick={() => handleDelete(d.id, d.file_url)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload RPP</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Judul RPP</label>
                                <input className="form-input" placeholder="Masukkan judul RPP"
                                    value={judul} onChange={(e) => setJudul(e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Tingkat</label>
                                    <select className="form-select" value={tingkat}
                                        onChange={(e) => handleTingkatChange(Number(e.target.value))}>
                                        {TINGKAT_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mata Pelajaran</label>
                                    <select className="form-select" value={mapel}
                                        onChange={(e) => setMapel(e.target.value)}>
                                        {getMapelOptions(tingkat).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Semester</label>
                                    <select className="form-select" value={semester}
                                        onChange={(e) => setSemester(e.target.value)}>
                                        {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tujuan Pembelajaran</label>
                                    <select className="form-select" value={tp}
                                        onChange={(e) => setTp(e.target.value)}>
                                        {TP_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ maxWidth: '50%', margin: '0 auto', textAlign: 'center' }}>
                                <div className="form-group">
                                    <label className="form-label">Tahun Ajaran</label>
                                    <select className="form-select" value={tahunAjaran}
                                        onChange={(e) => setTahunAjaran(e.target.value)}>
                                        {TAHUN_AJARAN_OPTIONS.map(ta => <option key={ta} value={ta}>{ta}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">File RPP</label>
                                <div className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]) }}>
                                    {file ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={20} /> <span>{file.name}</span>
                                            <button className="btn btn-ghost" onClick={() => setFile(null)}><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center' }}>
                                            <Upload size={32} style={{ color: 'var(--neutral-300)', marginBottom: '0.5rem' }} />
                                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>Drag & drop atau</p>
                                            <label className="btn btn-outline" style={{ cursor: 'pointer', marginTop: '0.5rem' }}>
                                                Pilih File
                                                <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !judul || !file}>
                                {uploading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Mengupload...</> : <><Upload size={16} /> Upload RPP</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
