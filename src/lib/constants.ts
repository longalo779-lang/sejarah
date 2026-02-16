// ============================================
// Validasi Registrasi Guru
// ============================================

// Daftar NIP yang diizinkan untuk registrasi guru
export const ALLOWED_NIP_LIST: string[] = [
    '197802152009012001',
    '199409102019032018',
    '196908172014082001',
    '199105182023212040',
    // Tambahkan NIP guru lainnya di sini
]

// Kode akses untuk guru yang tidak memiliki NIP
export const GURU_ACCESS_CODE = '969'

// ============================================
// Kelas & Mapel Constants
// ============================================

export const TINGKAT_OPTIONS = [
    { value: 10, label: 'X' },
    { value: 11, label: 'XI' },
    { value: 12, label: 'XII' },
]

export const KELAS_MAP: Record<number, string[]> = {
    10: Array.from({ length: 11 }, (_, i) => `X ${i + 1}`),
    11: Array.from({ length: 10 }, (_, i) => `XI ${i + 1}`),
    12: Array.from({ length: 11 }, (_, i) => `XII ${i + 1}`),
}

export const ALL_KELAS = [
    ...KELAS_MAP[10],
    ...KELAS_MAP[11],
    ...KELAS_MAP[12],
]

export const MAPEL_OPTIONS = [
    { value: 'Sejarah', label: 'Sejarah' },
    { value: 'STL', label: 'Sejarah Tingkat Lanjut (STL)' },
]

export const SEMESTER_OPTIONS = [
    { value: 'Ganjil', label: 'Ganjil' },
    { value: 'Genap', label: 'Genap' },
]

export const TP_OPTIONS = [
    { value: 'TP1', label: 'TP 1' },
    { value: 'TP2', label: 'TP 2' },
    { value: 'TP3', label: 'TP 3' },
    { value: 'TP4', label: 'TP 4' },
]

/**
 * Get kelas options for a given tingkat
 */
export function getKelasOptions(tingkat: number): string[] {
    return KELAS_MAP[tingkat] || []
}

/**
 * Get mapel options for a given tingkat
 * Kelas X: hanya Sejarah
 * Kelas XI & XII: Sejarah + STL
 */
export function getMapelOptions(tingkat: number) {
    if (tingkat === 10) {
        return [{ value: 'Sejarah', label: 'Sejarah' }]
    }
    return MAPEL_OPTIONS
}

/**
 * Get tingkat from nama_kelas string
 * e.g., "X 1" → 10, "XI 5" → 11, "XII 3" → 12
 */
export function getTingkatFromKelas(namaKelas: string): number {
    if (namaKelas.startsWith('XII')) return 12
    if (namaKelas.startsWith('XI')) return 11
    if (namaKelas.startsWith('X')) return 10
    return 10
}
