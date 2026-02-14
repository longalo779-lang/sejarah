'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Camera, Save, X } from 'lucide-react'

export default function GuruProfilPage() {
    const [nama, setNama] = useState('')
    const [email, setEmail] = useState('')
    const [nip, setNip] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles')
                .select('*').eq('id', user.id).single()

            if (profile) {
                setNama(profile.nama || '')
                setEmail(profile.email || '')
                setNip(profile.nip || '')
                setAvatarUrl(profile.avatar_url || null)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB')
            return
        }
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const handleSave = async () => {
        if (!nama.trim()) {
            alert('Nama tidak boleh kosong')
            return
        }
        setSaving(true)
        setSuccess(false)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let newAvatarUrl = avatarUrl

            // Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true })

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    alert('Gagal mengupload foto. Pastikan bucket "avatars" sudah dibuat.')
                    setSaving(false)
                    return
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath)

                newAvatarUrl = publicUrl
            }

            // Update profile
            const { error: updateError } = await supabase.from('profiles')
                .update({
                    nama: nama.trim(),
                    avatar_url: newAvatarUrl,
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            setAvatarUrl(newAvatarUrl)
            setAvatarFile(null)
            setAvatarPreview(null)
            setSuccess(true)

            // Refresh page to update sidebar
            setTimeout(() => window.location.reload(), 1500)
        } catch (err) {
            console.error('Save error:', err)
            alert('Gagal menyimpan profil')
        } finally {
            setSaving(false)
        }
    }

    const displayAvatar = avatarPreview || avatarUrl
    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><User size={28} /> Profil Saya</h1>
                    <p className="page-subtitle">Edit nama dan foto profil Anda</p>
                </div>
            </div>

            <div>
                <div className="card" style={{ padding: '2rem' }}>
                    {success && (
                        <div style={{
                            background: 'var(--success-light)', color: 'var(--success)',
                            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                            fontSize: '0.875rem', marginBottom: '1.5rem',
                            border: '1px solid var(--success)',
                        }}>
                            ✅ Profil berhasil disimpan! Halaman akan di-refresh...
                        </div>
                    )}

                    {/* Avatar Section */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            {displayAvatar ? (
                                <img
                                    src={displayAvatar}
                                    alt="Foto Profil"
                                    style={{
                                        width: '120px', height: '120px', borderRadius: '50%',
                                        objectFit: 'cover', border: '4px solid var(--primary-200)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '120px', height: '120px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '2.5rem', fontWeight: 700,
                                    border: '4px solid var(--primary-200)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                }}>
                                    {getInitials(nama || 'G')}
                                </div>
                            )}

                            <label style={{
                                position: 'absolute', bottom: '0', right: '0',
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'var(--primary-500)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', border: '3px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'background 0.2s',
                            }}
                                title="Ganti Foto"
                            >
                                <Camera size={16} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>

                        {avatarPreview && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <button
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.75rem', color: 'var(--accent-600)' }}
                                    onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                                >
                                    <X size={14} /> Batal ganti foto
                                </button>
                            </div>
                        )}

                        <p style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', marginTop: '0.5rem' }}>
                            Klik ikon kamera untuk mengganti foto (maks 2MB)
                        </p>
                    </div>

                    {/* Form Fields */}
                    <div className="form-group">
                        <label className="form-label">Nama Lengkap</label>
                        <input
                            className="form-input"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            placeholder="Masukkan nama lengkap"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            className="form-input"
                            value={email}
                            disabled
                            style={{ background: 'var(--neutral-100)', color: 'var(--neutral-400)' }}
                        />
                        <small style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>
                            Email tidak dapat diubah
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">NIP</label>
                        <input
                            className="form-input"
                            value={nip}
                            disabled
                            style={{ background: 'var(--neutral-100)', color: 'var(--neutral-400)' }}
                        />
                        <small style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>
                            NIP tidak dapat diubah dari halaman ini
                        </small>
                    </div>

                    <button
                        className="btn btn-primary btn-lg btn-block"
                        onClick={handleSave}
                        disabled={saving}
                        style={{ marginTop: '1rem' }}
                    >
                        {saving ? (
                            <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Menyimpan...</>
                        ) : (
                            <><Save size={18} /> Simpan Perubahan</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
