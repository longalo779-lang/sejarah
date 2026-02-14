'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import {
    BookOpen,
    LayoutDashboard,
    FileText,
    ClipboardList,
    Award,
    FolderOpen,
    FileSpreadsheet,
    LogOut,
    Menu,
    X,
    GraduationCap,
    Upload,
    User,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface SidebarProps {
    profile: Profile
}

export default function Sidebar({ profile }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const isGuru = profile.role === 'guru'
    const basePath = isGuru ? '/guru' : '/siswa'

    const guruNav = [
        {
            label: 'Menu Utama', items: [
                { href: '/guru/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            ]
        },
        {
            label: 'Pembelajaran', items: [
                { href: '/guru/rpp', icon: FileSpreadsheet, label: 'RPP' },
                { href: '/guru/materi', icon: BookOpen, label: 'Materi' },
                { href: '/guru/tugas', icon: ClipboardList, label: 'Tugas' },
                { href: '/guru/nilai', icon: Award, label: 'Nilai Siswa' },
            ]
        },
        {
            label: 'Dokumen', items: [
                { href: '/guru/dokumen', icon: FolderOpen, label: 'Prota & Prosem' },
            ]
        },
    ]

    const siswaNav = [
        {
            label: 'Menu Utama', items: [
                { href: '/siswa/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            ]
        },
        {
            label: 'Pembelajaran', items: [
                { href: '/siswa/materi', icon: BookOpen, label: 'Materi' },
                { href: '/siswa/tugas', icon: Upload, label: 'Tugas' },
                { href: '/siswa/nilai', icon: Award, label: 'Nilai Saya' },
            ]
        },
    ]

    const navItems = isGuru ? guruNav : siswaNav

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Profile Avatar - Top Right */}
            <div ref={profileRef} style={{ position: 'fixed', top: '1rem', right: '1.5rem', zIndex: 1000 }}>
                <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    style={{
                        width: '42px', height: '42px', borderRadius: '50%', border: '2.5px solid var(--primary-400)',
                        background: profile.avatar_url ? 'none' : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                        cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.85rem', padding: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)' }}
                    title={profile.nama}
                >
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.nama}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        getInitials(profile.nama)
                    )}
                </button>

                {/* Dropdown */}
                {profileOpen && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                        background: 'white', borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        minWidth: '220px', overflow: 'hidden', border: '1px solid var(--neutral-100)',
                        animation: 'fadeIn 0.15s ease',
                    }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--neutral-100)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--secondary-800)', fontSize: '0.9rem' }}>{profile.nama}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.15rem' }}>
                                {profile.role === 'guru' ? 'Guru Sejarah' : `Siswa — Kelas ${profile.nama_kelas}`}
                            </div>
                        </div>
                        {isGuru && (
                            <Link href="/guru/profil" onClick={() => setProfileOpen(false)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem',
                                    color: 'var(--secondary-700)', textDecoration: 'none', fontSize: '0.875rem',
                                    transition: 'background 0.15s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <User size={16} /> Edit Profil
                            </Link>
                        )}
                        <button onClick={handleLogout}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem',
                                color: 'var(--danger-600)', fontSize: '0.875rem', width: '100%',
                                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                                borderTop: '1px solid var(--neutral-100)', transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-50)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <LogOut size={16} /> Keluar
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-icon" style={{ overflow: 'hidden', padding: 0 }}>
                            <img src="/sma1.jpg" alt="SMA Negeri 1 Limboto" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                        </div>
                        <div className="brand-text">
                            <h2>Sejarah Digital</h2>
                            <p>SMA Negeri 1 Limboto</p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((group, gi) => (
                        <div key={gi}>
                            <div className="sidebar-nav-label">{group.label}</div>
                            {group.items.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <Icon size={20} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div style={{ textAlign: 'center', padding: '0.75rem', opacity: 0.5 }}>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
                            Powered by <strong>WebDevPro</strong>
                        </span>
                    </div>
                </div>
            </aside>
        </>
    )
}
