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
