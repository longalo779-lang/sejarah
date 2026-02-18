import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// This uses the service role to bypass RLS for NIP lookup
// Falls back to creating an admin-like client with anon key
export async function POST(req: NextRequest) {
    try {
        const { nip } = await req.json()

        if (!nip || typeof nip !== 'string') {
            return NextResponse.json({ error: 'NIP wajib diisi' }, { status: 400 })
        }

        // Create a Supabase client with service role key (bypasses RLS)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // Look up email by NIP - check both nis and nip columns
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('email')
            .or(`nis.eq.${nip.trim()},nip.eq.${nip.trim()}`)
            .eq('role', 'guru')
            .single()

        if (error || !profile || !profile.email) {
            return NextResponse.json(
                { error: 'NIP tidak ditemukan. Pastikan NIP Anda sudah terdaftar.' },
                { status: 404 }
            )
        }

        return NextResponse.json({ email: profile.email })
    } catch (err) {
        return NextResponse.json(
            { error: 'Terjadi kesalahan server.' },
            { status: 500 }
        )
    }
}
