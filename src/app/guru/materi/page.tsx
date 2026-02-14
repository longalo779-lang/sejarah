'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Upload, Download, Trash2, Search, X, FileText } from 'lucide-react'
import { TINGKAT_OPTIONS, SEMESTER_OPTIONS, getKelasOptions, getMapelOptions } from '@/lib/constants'

interface MateriItem {
    id: string; judul: string; deskripsi: string | null
    file_url: string; file_name: string
    tingkat: number; nama_kelas: string; mapel: string
    semester: string; created_at: string
}

export default function GuruMateriPage() {
    const [materiList, setMateriList] = useState<MateriItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [filterTingkat, setFilterTingkat] = useState<number>(10)
    const [filterKelas, setFilterKelas] = useState('')
    const [filterMapel, setFilterMapel] = useState('')
    const [filterSemester, setFilterSemester] = useState('Ganjil')
    const [search, setSearch] = useState('')

    // Form state
    const [judul, setJudul] = useState('')
    const [deskripsi, setDeskripsi] = useState('')
    const [tingkat, setTingkat] = useState(10)
    const [namaKelas, setNamaKelas] = useState('X 1')
    const [mapel, setMapel] = useState('Sejarah')
    const [semester, setSemester] = useState('Ganjil')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)

    const supabase = createClient()

    const fetchMateri = async () => {
        let query = supabase.from('materi').select('*')
            .eq('tingkat', filterTingkat)
            .eq('semester', filterSemester)
            .order('created_at', { ascending: false })
        if (filterKelas) query = query.eq('nama_kelas', filterKelas)
        if (filterMapel) query = query.eq('mapel', filterMapel)
        const { data } = await query
        setMateriList(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchMateri() }, [filterTingkat, filterKelas, filterMapel, filterSemester])

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
            const { error: uploadError } = await supabase.storage.from('materi').upload(filePath, file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('materi').getPublicUrl(filePath)

            await supabase.from('materi').insert({
                judul, deskripsi: deskripsi || null,
                file_url: publicUrl, file_name: file.name,
                tingkat, nama_kelas: namaKelas,
                mapel, semester, created_by: user.id,
            })

            setShowModal(false)
            setJudul(''); setDeskripsi(''); setFile(null)
            fetchMateri()
        } catch (err) {
            console.error('Upload error:', err)
            alert('Gagal mengupload materi')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string, fileUrl: string) => {
        if (!confirm('Hapus materi ini?')) return
        try {
            const path = fileUrl.split('/storage/v1/object/public/materi/')[1]
            if (path) await supabase.storage.from('materi').remove([path])
            await supabase.from('materi').delete().eq('id', id)
            fetchMateri()
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    const filtered = materiList.filter(m =>
        m.judul.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><BookOpen size={28} /> Kelola Materi</h1>
                    <p className="page-subtitle">Upload dan kelola materi pembelajaran sejarah</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Upload size={16} /> Upload Materi
                </button>
            </div>

            {/* Filters — same layout as Nilai */}
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
                    <div className="form-group" style={{ flex: 2, minWidth: '180px', marginBottom: 0 }}>
                        <label className="form-label">Cari</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                            <input className="form-input" placeholder="Cari materi..."
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Materi Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FileText size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--neutral-500)' }}>Belum ada materi</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filtered.map(m => (
                        <div key={m.id} className="card card-hover">
                            <div style={{ marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--secondary-800)', marginBottom: '0.5rem' }}>{m.judul}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="badge badge-primary">{m.nama_kelas}</span>
                                    <span className="badge badge-info">{m.mapel}</span>
                                    <span className="badge badge-warning">Smt {m.semester}</span>
                                </div>
                            </div>
                            {m.deskripsi && <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: '0.75rem' }}>{m.deskripsi}</p>}
                            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginBottom: '1rem' }}>
                                📄 {m.file_name} • {new Date(m.created_at).toLocaleDateString('id-ID')}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <a href={m.file_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem' }}>
                                    <Download size={14} /> Download
                                </a>
                                <button className="btn btn-danger" style={{ fontSize: '0.8rem' }} onClick={() => handleDelete(m.id, m.file_url)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload Materi Baru</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Judul Materi</label>
                                <input className="form-input" placeholder="Masukkan judul"
                                    value={judul} onChange={(e) => setJudul(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deskripsi</label>
                                <textarea className="form-input" placeholder="Deskripsi materi (opsional)"
                                    value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={2} />
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
                                    <label className="form-label">Kelas</label>
                                    <select className="form-select" value={namaKelas}
                                        onChange={(e) => setNamaKelas(e.target.value)}>
                                        {getKelasOptions(tingkat).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Mata Pelajaran</label>
                                    <select className="form-select" value={mapel}
                                        onChange={(e) => setMapel(e.target.value)}>
                                        {getMapelOptions(tingkat).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Semester</label>
                                    <select className="form-select" value={semester}
                                        onChange={(e) => setSemester(e.target.value)}>
                                        {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">File</label>
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
                                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>Drag & drop file atau</p>
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
                                {uploading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Mengupload...</> : <><Upload size={16} /> Upload</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
