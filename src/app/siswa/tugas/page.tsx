'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Upload, Clock, CheckCircle2, FileText, X, Award, Eye } from 'lucide-react'
import { getMapelOptions } from '@/lib/constants'

interface TugasItem {
    id: string; judul: string; deskripsi: string | null
    file_url: string | null; file_name: string | null
    nama_kelas: string; mapel: string
    deadline: string; created_at: string
    submitted?: boolean
    checked?: boolean
    checked_at?: string | null
    nilai?: number | null
    profiles?: { nama: string; avatar_url: string | null }
}

export default function SiswaTugasPage() {
    const [tugasList, setTugasList] = useState<TugasItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showUpload, setShowUpload] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [catatan, setCatatan] = useState('')
    const [uploading, setUploading] = useState(false)
    const [filterMapel, setFilterMapel] = useState('')
    const [filterKategori, setFilterKategori] = useState('')
    const [now, setNow] = useState(new Date())
    const [tingkat, setTingkat] = useState(10)

    const supabase = createClient()

    const fetchTugas = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles')
            .select('nama_kelas').eq('id', user.id).single()
        if (!profile?.nama_kelas) return
        const k = profile.nama_kelas
        setTingkat(k.startsWith('XII') ? 12 : k.startsWith('XI') ? 11 : 10)

        let query = supabase.from('tugas').select('*, profiles!tugas_created_by_fkey(nama, avatar_url)')
            .eq('nama_kelas', profile.nama_kelas)
            .order('deadline', { ascending: true })
        if (filterMapel) query = query.eq('mapel', filterMapel)
        if (filterKategori) query = query.eq('kategori', filterKategori)
        const { data: tugasData } = await query

        // Get submissions with checked + nilai
        const { data: submissions } = await supabase.from('tugas_submissions')
            .select('tugas_id, checked, checked_at, nilai')
            .eq('siswa_id', user.id)
        const subMap: Record<string, { checked: boolean; checked_at: string | null; nilai: number | null }> = {}
        submissions?.forEach(s => { subMap[s.tugas_id] = { checked: s.checked, checked_at: s.checked_at, nilai: s.nilai } })

        setTugasList((tugasData || []).map(t => ({
            ...t,
            submitted: !!subMap[t.id],
            checked: subMap[t.id]?.checked || false,
            checked_at: subMap[t.id]?.checked_at || null,
            nilai: subMap[t.id]?.nilai ?? null,
            profiles: (t as any).profiles || null,
        })))
        setLoading(false)
    }, [filterMapel])

    useEffect(() => { fetchTugas() }, [fetchTugas])
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const getCountdown = (deadline: string) => {
        const diff = new Date(deadline).getTime() - now.getTime()
        if (diff <= 0) return { text: 'Waktu habis', expired: true }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        return {
            text: `${days}h ${hours}j ${minutes}m ${seconds}d`,
            expired: false,
        }
    }

    const handleSubmit = async (tugasId: string, fileRequired: boolean = true) => {
        if (fileRequired && !file) return
        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let fileUrl = ''
            let fileName = 'Tanpa file'

            if (file) {
                const filePath = `${user.id}/${Date.now()}_${file.name}`
                const { error } = await supabase.storage.from('submissions').upload(filePath, file)
                if (error) throw error
                const { data: { publicUrl } } = supabase.storage.from('submissions').getPublicUrl(filePath)
                fileUrl = publicUrl
                fileName = file.name
            }

            await supabase.from('tugas_submissions').insert({
                tugas_id: tugasId, siswa_id: user.id,
                file_url: fileUrl, file_name: fileName,
                catatan: catatan || null,
            })

            setShowUpload(null); setFile(null); setCatatan('')
            fetchTugas()
        } catch (err) {
            console.error('Submit error:', err)
            alert('Gagal mengirim tugas')
        } finally {
            setUploading(false)
        }
    }

    const handleConfirm = async (tugasId: string) => {
        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase.from('tugas_submissions').insert({
                tugas_id: tugasId, siswa_id: user.id,
                file_url: '', file_name: 'Konfirmasi Selesai',
                catatan: 'Siswa mengonfirmasi telah menyelesaikan',
            })

            fetchTugas()
        } catch (err) {
            console.error('Confirm error:', err)
            alert('Gagal mengonfirmasi')
        } finally {
            setUploading(false)
        }
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
                    <h1 className="page-title"><ClipboardList size={28} /> Tugas Saya</h1>
                    <p className="page-subtitle">Lihat dan kerjakan tugas dari guru</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                        <label className="form-label">Mapel</label>
                        <select className="form-select" value={filterMapel}
                            onChange={(e) => setFilterMapel(e.target.value)}>
                            {tingkat > 10 && <option value="">Semua</option>}
                            {getMapelOptions(tingkat).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : tugasList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <ClipboardList size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--neutral-500)' }}>Tidak ada tugas saat ini</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {tugasList.map(t => {
                        const countdown = getCountdown(t.deadline)
                        return (
                            <div key={t.id} className="card card-hover">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary-800)', marginBottom: '0.5rem' }}>{t.judul}</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                            <span className="badge badge-info">{t.mapel}</span>
                                            {(t as any).semester && <span className="badge badge-warning">Smt {(t as any).semester}</span>}
                                            {(t as any).tp && <span className="badge badge-success">{(t as any).tp}</span>}
                                            {(t as any).kategori && <span className="badge" style={{ background: 'var(--secondary-100)', color: 'var(--secondary-700)' }}>{(t as any).kategori}</span>}
                                            {t.submitted ? (
                                                <>
                                                    <span className="badge badge-success"><CheckCircle2 size={12} /> Sudah dikumpulkan</span>
                                                    {t.checked ? (
                                                        <span className="badge badge-primary"><Eye size={12} /> Sudah diperiksa</span>
                                                    ) : (
                                                        <span className="badge badge-warning"><Clock size={12} /> Menunggu diperiksa</span>
                                                    )}
                                                </>
                                            ) : countdown.expired ? (
                                                <span className="badge badge-danger"><Clock size={12} /> Terlambat</span>
                                            ) : (
                                                <span className="badge badge-warning"><Clock size={12} /> {countdown.text}</span>
                                            )}
                                        </div>

                                        {/* Show grade if available */}
                                        {t.submitted && t.nilai !== null && t.nilai !== undefined && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.5rem 0.75rem', marginBottom: '0.5rem',
                                                background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--neutral-200)',
                                            }}>
                                                <Award size={16} style={{ color: 'var(--primary-500)' }} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Nilai Tugas:</span>
                                                <span className={`badge ${getNilaiBadge(t.nilai)}`} style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                                    {t.nilai}
                                                </span>
                                            </div>
                                        )}

                                        {t.deskripsi && <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: '0.5rem' }}>{t.deskripsi}</p>}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            {t.profiles?.avatar_url ? (
                                                <img src={t.profiles.avatar_url} alt={t.profiles.nama}
                                                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{
                                                    width: '22px', height: '22px', borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '0.55rem', fontWeight: 700,
                                                }}>
                                                    {(t.profiles?.nama || 'G').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                            )}
                                            <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: 500 }}>
                                                {t.profiles?.nama || 'Guru'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--neutral-400)' }}>
                                            ⏰ Deadline: {new Date(t.deadline).toLocaleString('id-ID')}
                                            {t.file_name && (
                                                <> • <a href={t.file_url!} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-600)' }}>📄 {t.file_name}</a></>
                                            )}
                                        </p>
                                    </div>
                                    {!t.submitted && !countdown.expired && (
                                        (t as any).kategori === 'UTS' || (t as any).kategori === 'UAS' || (t as any).kategori === 'Praktik' ? (
                                            <button className="btn btn-primary" onClick={() => handleConfirm(t.id)} disabled={uploading}>
                                                <CheckCircle2 size={14} /> {uploading ? 'Mengonfirmasi...' : 'Konfirmasi Selesai'}
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary" onClick={() => setShowUpload(t.id)}>
                                                <Upload size={14} /> Kumpulkan
                                            </button>
                                        )
                                    )}
                                </div>

                                {showUpload === t.id && (t as any).kategori !== 'UTS' && (t as any).kategori !== 'UAS' && (t as any).kategori !== 'Praktik' && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-200)' }}>
                                        <div className="form-group">
                                            <label className="form-label">
                                                {(t as any).kategori === 'Ulangan Harian' ? 'File Ulangan (opsional)' : 'File Tugas'}
                                            </label>
                                            {file ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FileText size={18} /> <span>{file.name}</span>
                                                    <button className="btn btn-ghost" onClick={() => setFile(null)}><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <label className="btn btn-outline btn-block" style={{ cursor: 'pointer' }}>
                                                    <Upload size={16} /> Pilih File
                                                    <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                                </label>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Catatan (opsional)</label>
                                            <input className="form-input" placeholder="Catatan untuk guru"
                                                value={catatan} onChange={(e) => setCatatan(e.target.value)} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'end' }}>
                                            <button className="btn btn-outline" onClick={() => { setShowUpload(null); setFile(null); setCatatan('') }}>Batal</button>
                                            <button className="btn btn-primary"
                                                onClick={() => handleSubmit(t.id, (t as any).kategori !== 'Ulangan Harian')}
                                                disabled={uploading || ((t as any).kategori !== 'Ulangan Harian' && !file)}>
                                                {uploading ? 'Mengirim...' : (t as any).kategori === 'Ulangan Harian' ? 'Kirim' : 'Kirim Tugas'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
