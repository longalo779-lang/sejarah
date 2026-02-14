'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, Plus, Trash2, Edit3, X, Save } from 'lucide-react'
import { TINGKAT_OPTIONS, SEMESTER_OPTIONS, getKelasOptions, getMapelOptions } from '@/lib/constants'

interface NilaiItem {
    id: string; siswa_id: string; tingkat: number
    nama_kelas: string; mapel: string; semester: string
    kategori: string; judul: string; nilai: number
    keterangan: string | null; created_at: string
    profiles?: { nama: string; nis: string }
}

interface SiswaOption {
    id: string; nama: string; nis: string; nama_kelas: string
}

export default function GuruNilaiPage() {
    const [nilaiList, setNilaiList] = useState<NilaiItem[]>([])
    const [siswaList, setSiswaList] = useState<SiswaOption[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [filterTingkat, setFilterTingkat] = useState<number>(10)
    const [filterKelas, setFilterKelas] = useState('')
    const [filterMapel, setFilterMapel] = useState('')
    const [filterSemester, setFilterSemester] = useState('Ganjil')

    // Form
    const [siswaId, setSiswaId] = useState('')
    const [kategori, setKategori] = useState('Ulangan Harian')
    const [judul, setJudul] = useState('')
    const [nilai, setNilai] = useState<number>(0)
    const [keterangan, setKeterangan] = useState('')
    const [formMapel, setFormMapel] = useState('Sejarah')
    const [saving, setSaving] = useState(false)

    const supabase = createClient()

    const fetchNilai = async () => {
        let query = supabase.from('nilai')
            .select('*, profiles(nama, nis)')
            .eq('tingkat', filterTingkat)
            .eq('semester', filterSemester)
            .order('created_at', { ascending: false })
        if (filterKelas) query = query.eq('nama_kelas', filterKelas)
        if (filterMapel) query = query.eq('mapel', filterMapel)
        const { data } = await query
        setNilaiList(data || [])
        setLoading(false)
    }

    const fetchSiswa = async () => {
        let query = supabase.from('profiles').select('id, nama, nis, nama_kelas')
            .eq('role', 'siswa').eq('tingkat', filterTingkat)
        if (filterKelas) query = query.eq('nama_kelas', filterKelas)
        const { data } = await query
        setSiswaList(data || [])
    }

    useEffect(() => { fetchNilai(); fetchSiswa() }, [filterTingkat, filterKelas, filterMapel, filterSemester])

    const handleSave = async () => {
        if (!siswaId || !judul || nilai === undefined) return
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const targetSiswa = siswaList.find(s => s.id === siswaId)
            const record = {
                siswa_id: siswaId,
                tingkat: filterTingkat,
                nama_kelas: targetSiswa?.nama_kelas || filterKelas,
                mapel: formMapel,
                semester: filterSemester,
                kategori, judul, nilai,
                keterangan: keterangan || null,
                created_by: user.id,
            }

            if (editId) {
                await supabase.from('nilai').update(record).eq('id', editId)
            } else {
                await supabase.from('nilai').insert(record)
            }

            resetForm()
            fetchNilai()
        } catch (err) {
            console.error('Save error:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (n: NilaiItem) => {
        setEditId(n.id); setSiswaId(n.siswa_id)
        setKategori(n.kategori); setJudul(n.judul)
        setNilai(n.nilai); setKeterangan(n.keterangan || '')
        setFormMapel(n.mapel)
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus nilai ini?')) return
        await supabase.from('nilai').delete().eq('id', id)
        fetchNilai()
    }

    const resetForm = () => {
        setShowModal(false); setEditId(null)
        setSiswaId(''); setKategori('Ulangan Harian')
        setJudul(''); setNilai(0); setKeterangan('')
        setFormMapel('Sejarah')
    }

    const getNilaiBadge = (n: number) => {
        if (n >= 90) return 'badge-success'
        if (n >= 75) return 'badge-primary'
        if (n >= 60) return 'badge-warning'
        return 'badge-danger'
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Award size={28} /> Kelola Nilai</h1>
                    <p className="page-subtitle">Input dan kelola nilai siswa</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
                    <Plus size={16} /> Input Nilai
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

            {/* Nilai Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : nilaiList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Award size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--neutral-500)' }}>Belum ada data nilai</p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Siswa</th>
                                <th>Kelas</th>
                                <th>Mapel</th>
                                <th>Kategori</th>
                                <th>Judul</th>
                                <th>Nilai</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nilaiList.map(n => (
                                <tr key={n.id}>
                                    <td>
                                        <strong>{n.profiles?.nama || '-'}</strong>
                                        <br /><small style={{ color: 'var(--neutral-400)' }}>{n.profiles?.nis}</small>
                                    </td>
                                    <td>{n.nama_kelas}</td>
                                    <td><span className="badge badge-info">{n.mapel}</span></td>
                                    <td>{n.kategori}</td>
                                    <td>{n.judul}</td>
                                    <td>
                                        <span className={`badge ${getNilaiBadge(n.nilai)}`}>{n.nilai}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleEdit(n)}>
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(n.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Input/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => resetForm()}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editId ? 'Edit Nilai' : 'Input Nilai Baru'}</h2>
                            <button className="btn btn-ghost" onClick={() => resetForm()}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Siswa</label>
                                <select className="form-select" value={siswaId} onChange={(e) => setSiswaId(e.target.value)}>
                                    <option value="">Pilih siswa...</option>
                                    {siswaList.map(s => (
                                        <option key={s.id} value={s.id}>{s.nama} ({s.nama_kelas}) - {s.nis}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Mapel</label>
                                    <select className="form-select" value={formMapel} onChange={(e) => setFormMapel(e.target.value)}>
                                        {getMapelOptions(filterTingkat).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kategori</label>
                                    <select className="form-select" value={kategori} onChange={(e) => setKategori(e.target.value)}>
                                        <option value="Ulangan Harian">Ulangan Harian</option>
                                        <option value="UTS">UTS</option>
                                        <option value="UAS">UAS</option>
                                        <option value="Tugas">Tugas</option>
                                        <option value="Praktik">Praktik</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Judul</label>
                                <input className="form-input" placeholder="Contoh: UH Bab 1"
                                    value={judul} onChange={(e) => setJudul(e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Nilai (0-100)</label>
                                    <input type="number" className="form-input" min={0} max={100}
                                        value={nilai} onChange={(e) => setNilai(Number(e.target.value))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Keterangan</label>
                                    <input className="form-input" placeholder="Opsional"
                                        value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => resetForm()}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !siswaId || !judul}>
                                {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Menyimpan...</> : <><Save size={16} /> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
