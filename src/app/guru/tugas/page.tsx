'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Plus, Trash2, X, Upload, FileText, Clock, Users, Download, CheckCircle2, Circle, Save } from 'lucide-react'
import { TINGKAT_OPTIONS, SEMESTER_OPTIONS, getKelasOptions, getMapelOptions } from '@/lib/constants'

interface TugasItem {
    id: string; judul: string; deskripsi: string | null
    file_url: string | null; file_name: string | null
    tingkat: number; nama_kelas: string; mapel: string
    semester: string; deadline: string; created_at: string
    submissionCount?: number
}

interface Submission {
    id: string; file_url: string; file_name: string
    catatan: string | null; submitted_at: string
    checked: boolean; checked_at: string | null; nilai: number | null
    siswa_id: string
    profiles?: { nama: string; nama_kelas: string }
}

export default function GuruTugasPage() {
    const [tugasList, setTugasList] = useState<TugasItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showSubmissions, setShowSubmissions] = useState<string | null>(null)
    const [selectedTugas, setSelectedTugas] = useState<TugasItem | null>(null)
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [filterTingkat, setFilterTingkat] = useState<number>(10)
    const [filterKelas, setFilterKelas] = useState('')
    const [filterMapel, setFilterMapel] = useState('')
    const [filterSemester, setFilterSemester] = useState('Ganjil')

    // Inline grading state per submission id
    const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<Record<string, boolean>>({})

    // Form
    const [judul, setJudul] = useState('')
    const [deskripsi, setDeskripsi] = useState('')
    const [tingkat, setTingkat] = useState(10)
    const [namaKelas, setNamaKelas] = useState('X 1')
    const [mapel, setMapel] = useState('Sejarah')
    const [semester, setSemester] = useState('Ganjil')
    const [deadlineDays, setDeadlineDays] = useState(7)
    const [deadlineHours, setDeadlineHours] = useState(0)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const supabase = createClient()

    const fetchTugas = async () => {
        let query = supabase.from('tugas').select('*')
            .eq('tingkat', filterTingkat)
            .eq('semester', filterSemester)
            .order('created_at', { ascending: false })
        if (filterKelas) query = query.eq('nama_kelas', filterKelas)
        if (filterMapel) query = query.eq('mapel', filterMapel)
        const { data } = await query

        if (data && data.length > 0) {
            const tugasIds = data.map(t => t.id)
            const { data: subCounts } = await supabase
                .from('tugas_submissions')
                .select('tugas_id')
                .in('tugas_id', tugasIds)

            const countMap: Record<string, number> = {}
            subCounts?.forEach(s => {
                countMap[s.tugas_id] = (countMap[s.tugas_id] || 0) + 1
            })
            setTugasList(data.map(t => ({ ...t, submissionCount: countMap[t.id] || 0 })))
        } else {
            setTugasList([])
        }
        setLoading(false)
    }

    const fetchSubmissions = async (tugas: TugasItem) => {
        const { data } = await supabase.from('tugas_submissions')
            .select('*, profiles(nama, nama_kelas)')
            .eq('tugas_id', tugas.id)
            .order('submitted_at', { ascending: true })
        const subs = data || []
        setSubmissions(subs)
        // Initialize grade inputs
        const inputs: Record<string, string> = {}
        subs.forEach(s => { inputs[s.id] = s.nilai !== null ? String(s.nilai) : '' })
        setGradeInputs(inputs)
        setSelectedTugas(tugas)
        setShowSubmissions(tugas.id)
    }

    useEffect(() => { fetchTugas() }, [filterTingkat, filterKelas, filterMapel, filterSemester])

    const handleTingkatChange = (val: number) => {
        setTingkat(val)
        setNamaKelas(getKelasOptions(val)[0])
        setMapel(getMapelOptions(val)[0].value)
    }

    const handleCreate = async () => {
        if (!judul) return
        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let fileUrl = null, fileName = null
            if (file) {
                const filePath = `${user.id}/${Date.now()}_${file.name}`
                const { error } = await supabase.storage.from('tugas').upload(filePath, file)
                if (error) throw error
                const { data: { publicUrl } } = supabase.storage.from('tugas').getPublicUrl(filePath)
                fileUrl = publicUrl; fileName = file.name
            }

            const deadline = new Date()
            deadline.setDate(deadline.getDate() + deadlineDays)
            deadline.setHours(deadline.getHours() + deadlineHours)

            await supabase.from('tugas').insert({
                judul, deskripsi: deskripsi || null,
                file_url: fileUrl, file_name: fileName,
                tingkat, nama_kelas: namaKelas,
                mapel, semester, deadline: deadline.toISOString(),
                created_by: user.id,
            })

            setShowModal(false)
            setJudul(''); setDeskripsi(''); setFile(null)
            setDeadlineDays(7); setDeadlineHours(0)
            fetchTugas()
        } catch (err) {
            console.error('Create error:', err)
            alert('Gagal membuat tugas')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus tugas ini?')) return
        await supabase.from('tugas').delete().eq('id', id)
        fetchTugas()
    }

    // Toggle checked status
    const handleToggleChecked = async (sub: Submission) => {
        const newChecked = !sub.checked
        setSaving(prev => ({ ...prev, [sub.id]: true }))
        await supabase.from('tugas_submissions').update({
            checked: newChecked,
            checked_at: newChecked ? new Date().toISOString() : null,
        }).eq('id', sub.id)
        setSubmissions(prev => prev.map(s =>
            s.id === sub.id ? { ...s, checked: newChecked, checked_at: newChecked ? new Date().toISOString() : null } : s
        ))
        setSaving(prev => ({ ...prev, [sub.id]: false }))
    }

    // Save grade for a submission
    const handleSaveGrade = async (sub: Submission) => {
        const val = parseInt(gradeInputs[sub.id])
        if (isNaN(val) || val < 0 || val > 100) {
            alert('Nilai harus antara 0 - 100')
            return
        }
        setSaving(prev => ({ ...prev, [sub.id]: true }))
        const { data: { user } } = await supabase.auth.getUser()

        // Update tugas_submissions
        await supabase.from('tugas_submissions').update({
            nilai: val,
            checked: true,
            checked_at: sub.checked_at || new Date().toISOString(),
        }).eq('id', sub.id)

        // Also insert/update in nilai table so it shows on siswa nilai page
        if (user && selectedTugas) {
            // Check if nilai record already exists for this tugas+siswa
            const { data: existing } = await supabase.from('nilai')
                .select('id')
                .eq('siswa_id', sub.siswa_id)
                .eq('judul', selectedTugas.judul)
                .eq('kategori', 'Tugas')
                .eq('mapel', selectedTugas.mapel)
                .eq('semester', selectedTugas.semester)
                .maybeSingle()

            if (existing) {
                await supabase.from('nilai').update({ nilai: val }).eq('id', existing.id)
            } else {
                await supabase.from('nilai').insert({
                    siswa_id: sub.siswa_id,
                    tingkat: selectedTugas.tingkat,
                    nama_kelas: sub.profiles?.nama_kelas || selectedTugas.nama_kelas,
                    mapel: selectedTugas.mapel,
                    semester: selectedTugas.semester,
                    kategori: 'Tugas',
                    judul: selectedTugas.judul,
                    nilai: val,
                    keterangan: `Nilai tugas: ${selectedTugas.judul}`,
                    created_by: user.id,
                })
            }
        }

        setSubmissions(prev => prev.map(s =>
            s.id === sub.id ? { ...s, nilai: val, checked: true, checked_at: s.checked_at || new Date().toISOString() } : s
        ))
        setSaving(prev => ({ ...prev, [sub.id]: false }))
    }

    const isExpired = (deadline: string) => new Date(deadline) < new Date()

    // Group submissions by class
    const groupedSubmissions = submissions.reduce<Record<string, Submission[]>>((acc, s) => {
        const kelas = s.profiles?.nama_kelas || 'Tanpa Kelas'
        if (!acc[kelas]) acc[kelas] = []
        acc[kelas].push(s)
        return acc
    }, {})

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><ClipboardList size={28} /> Kelola Tugas</h1>
                    <p className="page-subtitle">Buat dan kelola tugas untuk siswa</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Buat Tugas
                </button>
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
                </div>
            </div>

            {/* Tugas List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : tugasList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <ClipboardList size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--neutral-500)' }}>Belum ada tugas</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {tugasList.map(t => (
                        <div key={t.id} className="card card-hover">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--secondary-800)' }}>{t.judul}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                        <span className="badge badge-primary">{t.nama_kelas}</span>
                                        <span className="badge badge-info">{t.mapel}</span>
                                        <span className="badge badge-warning">Smt {t.semester}</span>
                                        <span className={`badge ${isExpired(t.deadline) ? 'badge-danger' : 'badge-success'}`}>
                                            <Clock size={12} /> {isExpired(t.deadline) ? 'Expired' : 'Aktif'}
                                        </span>
                                    </div>
                                    {t.deskripsi && <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: '0.5rem' }}>{t.deskripsi}</p>}
                                    <p style={{ fontSize: '0.8rem', color: 'var(--neutral-400)' }}>
                                        ⏰ Deadline: {new Date(t.deadline).toLocaleString('id-ID')}
                                        {t.file_name && ` • 📄 ${t.file_name}`}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button className="btn btn-outline" onClick={() => fetchSubmissions(t)}
                                        style={{ position: 'relative' }}>
                                        <Users size={14} /> Submissions
                                        {(t.submissionCount || 0) > 0 && (
                                            <span style={{
                                                position: 'absolute', top: '-6px', right: '-6px',
                                                background: 'var(--primary-500)', color: 'white',
                                                borderRadius: '50%', width: '20px', height: '20px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', fontWeight: 700,
                                            }}>
                                                {t.submissionCount}
                                            </span>
                                        )}
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(t.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Buat Tugas Baru</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Judul Tugas</label>
                                <input className="form-input" placeholder="Masukkan judul tugas"
                                    value={judul} onChange={(e) => setJudul(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deskripsi</label>
                                <textarea className="form-input" placeholder="Deskripsi tugas (opsional)"
                                    value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={3} />
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Deadline (Hari)</label>
                                    <input type="number" className="form-input" min={0} value={deadlineDays}
                                        onChange={(e) => setDeadlineDays(Number(e.target.value))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deadline (Jam)</label>
                                    <input type="number" className="form-input" min={0} max={23} value={deadlineHours}
                                        onChange={(e) => setDeadlineHours(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">File Lampiran (opsional)</label>
                                {file ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)' }}>
                                        <FileText size={18} /> <span style={{ flex: 1 }}>{file.name}</span>
                                        <button className="btn btn-ghost" onClick={() => setFile(null)}><X size={16} /></button>
                                    </div>
                                ) : (
                                    <label className="btn btn-outline btn-block" style={{ cursor: 'pointer' }}>
                                        <Upload size={16} /> Pilih File
                                        <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={uploading || !judul}>
                                {uploading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Menyimpan...</> : <><Plus size={16} /> Buat Tugas</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submissions Modal with Check & Grade */}
            {showSubmissions && (
                <div className="modal-overlay" onClick={() => setShowSubmissions(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
                        <div className="modal-header">
                            <div>
                                <h2>Daftar Pengumpulan Tugas</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                                    {selectedTugas?.judul} • {submissions.length} siswa mengumpulkan
                                </p>
                            </div>
                            <button className="btn btn-ghost" onClick={() => setShowSubmissions(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {submissions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Users size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                                    <p style={{ color: 'var(--neutral-500)' }}>Belum ada siswa yang mengumpulkan tugas</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1.25rem' }}>
                                    {Object.entries(groupedSubmissions).map(([kelas, subs]) => (
                                        <div key={kelas}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                marginBottom: '0.75rem', paddingBottom: '0.5rem',
                                                borderBottom: '2px solid var(--primary-100)'
                                            }}>
                                                <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>{kelas}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--neutral-400)' }}>
                                                    {subs.length} siswa
                                                </span>
                                            </div>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table className="table" style={{ fontSize: '0.85rem' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '30px' }}>No</th>
                                                            <th>Nama Siswa</th>
                                                            <th>Tanggal</th>
                                                            <th>Jam</th>
                                                            <th>File</th>
                                                            <th style={{ width: '80px', textAlign: 'center' }}>Periksa</th>
                                                            <th style={{ width: '130px', textAlign: 'center' }}>Nilai (0-100)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {subs.map((s, idx) => {
                                                            const dt = new Date(s.submitted_at)
                                                            return (
                                                                <tr key={s.id} style={{ background: s.checked ? 'var(--success-light)' : undefined }}>
                                                                    <td>{idx + 1}</td>
                                                                    <td style={{ fontWeight: 500 }}>
                                                                        {s.profiles?.nama || 'Siswa'}
                                                                        {s.catatan && (
                                                                            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', margin: '0.15rem 0 0' }}>
                                                                                💬 {s.catatan}
                                                                            </p>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ whiteSpace: 'nowrap' }}>{dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                                    <td style={{ whiteSpace: 'nowrap' }}>{dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                                                    <td>
                                                                        <a href={s.file_url} target="_blank" rel="noreferrer"
                                                                            className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                                                                            <Download size={11} /> Download
                                                                        </a>
                                                                    </td>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        <button
                                                                            className={`btn ${s.checked ? 'btn-primary' : 'btn-outline'}`}
                                                                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                                                                            onClick={() => handleToggleChecked(s)}
                                                                            disabled={saving[s.id]}
                                                                            title={s.checked ? 'Sudah diperiksa' : 'Tandai sudah diperiksa'}
                                                                        >
                                                                            {s.checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                                                        </button>
                                                                    </td>
                                                                    <td>
                                                                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                                                            <input
                                                                                type="number" min={0} max={100}
                                                                                className="form-input"
                                                                                style={{ width: '65px', padding: '0.25rem 0.4rem', fontSize: '0.85rem', textAlign: 'center' }}
                                                                                placeholder="0-100"
                                                                                value={gradeInputs[s.id] ?? ''}
                                                                                onChange={(e) => setGradeInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                                            />
                                                                            <button
                                                                                className="btn btn-primary"
                                                                                style={{ padding: '0.3rem 0.4rem', fontSize: '0.7rem' }}
                                                                                onClick={() => handleSaveGrade(s)}
                                                                                disabled={saving[s.id] || !gradeInputs[s.id]}
                                                                                title="Simpan Nilai"
                                                                            >
                                                                                <Save size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
