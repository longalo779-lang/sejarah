'use client'

import Link from 'next/link'
import { BookOpen, Users, GraduationCap, ArrowRight, Code2, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

const developers = [
  { name: 'Zulkarnain Mopili', role: 'Developer', photo: '/dev-ketua.jpeg' },
  { name: 'Moh. Alpy Huntoyungo', role: 'Developer', photo: '/dev-alpi.jpeg' },
  { name: 'Fauzaan As. Ali', role: 'Developer', photo: '/dev-aan.jpeg' },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--neutral-50)' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1rem 2rem',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--neutral-200)' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/sma1.jpg" alt="Logo" style={{
            width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover',
            border: '2px solid ' + (scrolled ? 'var(--primary-300)' : 'rgba(255,255,255,0.5)'),
          }} />
          <span style={{
            fontWeight: 700, fontSize: '1.1rem',
            color: scrolled ? 'var(--secondary-800)' : 'white',
            textShadow: scrolled ? 'none' : '0 1px 3px rgba(0,0,0,0.3)',
          }}>
            Sejarah Digital
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/login" className="btn" style={{
            background: scrolled ? 'var(--primary-500)' : 'rgba(255,255,255,0.2)',
            color: 'white', border: '1px solid ' + (scrolled ? 'var(--primary-500)' : 'rgba(255,255,255,0.4)'),
            backdropFilter: 'blur(8px)', fontSize: '0.85rem', padding: '0.5rem 1.25rem',
          }}>
            Masuk
          </Link>
          <Link href="/register" className="btn" style={{
            background: 'var(--primary-500)', color: 'white',
            border: '1px solid var(--primary-500)', fontSize: '0.85rem', padding: '0.5rem 1.25rem',
          }}>
            Daftar
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'url(/tampilan-utama.jpeg) center/cover no-repeat fixed',
        position: 'relative', textAlign: 'center', padding: '2rem',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(30,20,10,0.7) 0%, rgba(60,30,15,0.6) 50%, rgba(20,10,5,0.8) 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '2rem', padding: '0.4rem 1rem', marginBottom: '1.5rem',
            color: 'var(--primary-200)', fontSize: '0.85rem',
          }}>
            <GraduationCap size={16} /> SMA Negeri 1 Limboto
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
            color: 'white', lineHeight: 1.15, marginBottom: '1.25rem',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            Media Pembelajaran <br />
            <span style={{ color: 'var(--primary-300)' }}>Sejarah</span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.7, marginBottom: '2rem', maxWidth: '550px', margin: '0 auto 2rem',
          }}>
            Platform digital untuk pembelajaran sejarah yang interaktif.
            Akses materi, kerjakan tugas, dan pantau nilai secara mudah dan efisien.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-lg" style={{
              background: 'var(--primary-500)', color: 'white',
              padding: '0.85rem 2rem', fontSize: '1rem',
              boxShadow: '0 4px 24px rgba(251,191,36,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}>
              Mulai Belajar <ArrowRight size={18} />
            </Link>
            <a href="#tentang" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)', padding: '0.85rem 2rem', fontSize: '1rem',
            }}>
              Tentang Kami
            </a>
          </div>

          <a href="#fitur" style={{
            display: 'inline-flex', marginTop: '3rem',
            animation: 'bounce 2s infinite', color: 'rgba(255,255,255,0.5)',
          }}>
            <ChevronDown size={28} />
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" style={{
        padding: 'clamp(3rem, 8vw, 6rem) 2rem',
        maxWidth: '1100px', margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700,
            color: 'var(--secondary-800)', marginBottom: '0.75rem',
          }}>
            Fitur Unggulan
          </h2>
          <p style={{ color: 'var(--neutral-500)', maxWidth: '500px', margin: '0 auto' }}>
            Fasilitas lengkap untuk mendukung proses belajar mengajar sejarah
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[
            {
              icon: BookOpen, title: 'Materi Digital', color: 'var(--primary-500)',
              desc: 'Akses materi pelajaran sejarah kapan saja dan di mana saja secara digital.',
            },
            {
              icon: Users, title: 'Tugas Interaktif', color: 'var(--accent-500)',
              desc: 'Kumpulkan tugas secara online, dapatkan feedback dan nilai langsung dari guru.',
            },
            {
              icon: GraduationCap, title: 'Pantau Nilai', color: '#10B981',
              desc: 'Lihat perkembangan nilai dan statistik belajar secara real-time.',
            },
          ].map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="card card-hover" style={{
                padding: '2rem', textAlign: 'center',
                border: '1px solid var(--neutral-100)',
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: f.color + '15', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <Icon size={26} style={{ color: f.color }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary-800)', marginBottom: '0.5rem' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Guru Pengajar Section */}
      <section style={{
        padding: 'clamp(3rem, 8vw, 5rem) 2rem',
        background: 'white',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--primary-100)', borderRadius: '2rem',
            padding: '0.4rem 1rem', marginBottom: '1rem',
            color: 'var(--primary-700)', fontSize: '0.8rem', fontWeight: 600,
          }}>
            <GraduationCap size={14} /> Guru Pengajar
          </div>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700,
            color: 'var(--secondary-800)', marginBottom: '2rem',
          }}>
            Guru Mata Pelajaran
          </h2>
          <div className="card card-hover" style={{
            padding: '2.5rem', display: 'inline-block',
            border: '1px solid var(--neutral-100)',
            maxWidth: '300px', width: '100%',
          }}>
            <img
              src="/dev-pengajar.jpeg"
              alt="Irawaty As Ali, S.Pd, M.Pd"
              style={{
                width: '130px', height: '130px', borderRadius: '50%',
                objectFit: 'cover', margin: '0 auto 1.25rem',
                border: '4px solid var(--primary-200)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                display: 'block',
              }}
            />
            <h3 style={{
              fontSize: '1.1rem', fontWeight: 700,
              color: 'var(--secondary-800)', marginBottom: '0.25rem',
            }}>
              Irawaty As Ali, S.Pd, M.Pd
            </h3>
            <p style={{
              fontSize: '0.85rem', color: 'var(--primary-600)',
              fontWeight: 500,
            }}>
              Guru Pengajar Sejarah
            </p>
          </div>
        </div>
      </section>

      {/* Developers Section */}
      <section id="tentang" style={{
        padding: 'clamp(3rem, 8vw, 6rem) 2rem',
        background: 'linear-gradient(180deg, var(--neutral-50) 0%, var(--primary-50) 100%)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--primary-100)', borderRadius: '2rem',
              padding: '0.4rem 1rem', marginBottom: '1rem',
              color: 'var(--primary-700)', fontSize: '0.8rem', fontWeight: 600,
            }}>
              <Code2 size={14} /> Tim Developer
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700,
              color: 'var(--secondary-800)', marginBottom: '0.75rem',
            }}>
              Dibuat Oleh
            </h2>
            <p style={{ color: 'var(--neutral-500)', maxWidth: '450px', margin: '0 auto' }}>
              Tim pengembang yang berdedikasi membangun platform pembelajaran digital ini
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem', justifyItems: 'center',
          }}>
            {developers.map((dev, i) => (
              <div key={i} className="card card-hover" style={{
                padding: '2rem', textAlign: 'center', width: '100%',
                border: '1px solid var(--neutral-100)',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}>
                <img
                  src={dev.photo}
                  alt={dev.name}
                  style={{
                    width: '110px', height: '110px', borderRadius: '50%',
                    objectFit: 'cover', margin: '0 auto 1.25rem',
                    border: '4px solid var(--primary-200)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <h3 style={{
                  fontSize: '1.05rem', fontWeight: 700,
                  color: 'var(--secondary-800)', marginBottom: '0.25rem',
                }}>
                  {dev.name}
                </h3>
                <p style={{
                  fontSize: '0.85rem', color: 'var(--primary-600)',
                  fontWeight: 500,
                }}>
                  {dev.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 2rem', textAlign: 'center',
        background: 'linear-gradient(135deg, var(--secondary-800) 0%, var(--secondary-900) 100%)',
      }}>
        <h2 style={{
          fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 700,
          color: 'white', marginBottom: '1rem',
        }}>
          Siap Untuk Memulai?
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.7)', marginBottom: '2rem',
          maxWidth: '450px', margin: '0 auto 2rem',
        }}>
          Bergabunglah dengan platform pembelajaran sejarah digital SMA Negeri 1 Limboto
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-lg" style={{
            background: 'var(--primary-500)', color: 'white',
            padding: '0.85rem 2.5rem', fontSize: '1rem',
            boxShadow: '0 4px 24px rgba(251,191,36,0.3)',
          }}>
            Daftar Sekarang
          </Link>
          <Link href="/login" className="btn btn-lg" style={{
            background: 'transparent', color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '0.85rem 2.5rem', fontSize: '1rem',
          }}>
            Masuk
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem', textAlign: 'center',
        background: 'var(--secondary-900)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>
          © 2026 Media Pembelajaran Sejarah — SMA Negeri 1 Limboto
        </p>
        <p style={{
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
        }}>
          <Code2 size={12} /> Developed by <strong style={{ color: 'var(--primary-400)' }}>Webdevpro</strong>
        </p>
      </footer>

      <style>{`
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
            `}</style>
    </div>
  )
}
