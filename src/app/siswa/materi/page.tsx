'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Download, Printer, Search, FileText } from 'lucide-react'
import { getMapelOptions } from '@/lib/constants'

interface MateriItem {
    id: string; judul: string; deskripsi: string | null
    file_url: string; file_name: string
    tingkat: number; nama_kelas: string; mapel: string
    created_at: string
    profiles?: { nama: string; avatar_url: string | null }
}

export default function SiswaMateriPage() {
    const [materiList, setMateriList] = useState<MateriItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterMapel, setFilterMapel] = useState('')
    const [namaKelas, setNamaKelas] = useState('')
    const [tingkat, setTingkat] = useState(10)

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles')
                .select('nama_kelas').eq('id', user.id).single()

            if (profile?.nama_kelas) {
                setNamaKelas(profile.nama_kelas)
                const k = profile.nama_kelas
                const t = k.startsWith('XII') ? 12 : k.startsWith('XI') ? 11 : 10
                setTingkat(t)
                let query = supabase.from('materi').select('*, profiles!materi_created_by_fkey(nama, avatar_url)')
                    .eq('nama_kelas', profile.nama_kelas)
                    .order('created_at', { ascending: false })
                if (filterMapel) query = query.eq('mapel', filterMapel)
                const { data } = await query
                setMateriList(data || [])
            }
            setLoading(false)
        }
        fetchData()
    }, [filterMapel])

    const filtered = materiList.filter(m =>
        m.judul.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><BookOpen size={28} /> Materi Pelajaran</h1>
                    <p className="page-subtitle">Materi untuk kelas {namaKelas}</p>
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
                    <div className="form-group" style={{ flex: 3, minWidth: '200px', marginBottom: 0 }}>
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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FileText size={48} style={{ color: 'var(--neutral-300)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--neutral-500)' }}>Belum ada materi untuk kelasmu</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filtered.map(m => (
                        <div key={m.id} className="card card-hover">
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--secondary-800)', marginBottom: '0.5rem' }}>{m.judul}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span className="badge badge-primary">{m.nama_kelas}</span>
                                <span className="badge badge-info">{m.mapel}</span>
                            </div>
                            {m.deskripsi && <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: '0.75rem' }}>{m.deskripsi}</p>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {m.profiles?.avatar_url ? (
                                    <img src={m.profiles.avatar_url} alt={m.profiles.nama}
                                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: '0.6rem', fontWeight: 700,
                                    }}>
                                        {(m.profiles?.nama || 'G').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                )}
                                <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: 500 }}>
                                    {m.profiles?.nama || 'Guru'}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginBottom: '1rem' }}>
                                📄 {m.file_name} • {new Date(m.created_at).toLocaleDateString('id-ID')}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <a href={m.file_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}>
                                    <Download size={14} /> Download
                                </a>
                                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }}
                                    onClick={() => { const w = window.open(m.file_url); w?.print() }}>
                                    <Printer size={14} /> Print
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
