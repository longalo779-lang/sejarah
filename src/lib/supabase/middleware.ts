import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Allow access to public pages (login, register, home)
    if (pathname === '/login' || pathname === '/register' || pathname === '/register/guru' || pathname === '/') {
        if (user) {
            // If logged in, get profile and redirect to dashboard
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile) {
                const dashboardUrl = profile.role === 'guru' ? '/guru/dashboard' : '/siswa/dashboard'
                const url = request.nextUrl.clone()
                url.pathname = dashboardUrl
                return NextResponse.redirect(url)
            }
        }
        return supabaseResponse
    }

    // Protect all other routes
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Role-based access control
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile) {
        if (pathname.startsWith('/guru') && profile.role !== 'guru') {
            const url = request.nextUrl.clone()
            url.pathname = '/siswa/dashboard'
            return NextResponse.redirect(url)
        }
        if (pathname.startsWith('/siswa') && profile.role !== 'siswa') {
            const url = request.nextUrl.clone()
            url.pathname = '/guru/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
