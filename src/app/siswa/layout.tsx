import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default async function SiswaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'siswa') redirect('/login')

    return (
        <div className="app-layout">
            <Sidebar profile={profile} />
            <main className="main-content">
                {children}
            </main>
        </div>
    )
}
