// ============================================
// Database Types - Media Pembelajaran Sejarah
// ============================================

export interface Profile {
    id: string
    nama: string
    email: string
    role: 'guru' | 'siswa'
    tingkat: number | null
    nama_kelas: string | null
    nis: string | null
    nip: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
}

export interface Materi {
    id: string
    judul: string
    deskripsi: string | null
    file_url: string
    file_name: string
    tingkat: number
    nama_kelas: string
    mapel: string
    created_by: string
    created_at: string
    updated_at: string
    profiles?: Profile
}

export interface Tugas {
    id: string
    judul: string
    deskripsi: string | null
    file_url: string | null
    file_name: string | null
    tingkat: number
    nama_kelas: string
    mapel: string
    deadline: string
    created_by: string
    created_at: string
    updated_at: string
    profiles?: Profile
}

export interface TugasSubmission {
    id: string
    tugas_id: string
    siswa_id: string
    file_url: string
    file_name: string
    catatan: string | null
    submitted_at: string
    profiles?: Profile
    tugas?: Tugas
}

export interface Nilai {
    id: string
    siswa_id: string
    tingkat: number
    nama_kelas: string
    mapel: string
    semester: string
    kategori: string
    judul: string
    nilai: number
    keterangan: string | null
    created_by: string
    created_at: string
    updated_at: string
    profiles?: Profile
}

export interface DokumenGuru {
    id: string
    judul: string
    tipe: 'prota' | 'prosem' | 'rpp'
    file_url: string
    file_name: string
    tingkat: number
    nama_kelas: string
    mapel: string
    semester: string
    tahun_ajaran: string
    created_by: string
    created_at: string
    updated_at: string
}
