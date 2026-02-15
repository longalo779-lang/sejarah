-- ============================================
-- Media Pembelajaran Sejarah - SMA 1 Limboto
-- Supabase Database Schema v2
-- Kelas: X 1-11, XI 1-10, XII 1-11
-- Mapel: Sejarah, STL (kelas X hanya Sejarah)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (safe re-run)
-- ============================================
DROP TABLE IF EXISTS dokumen_guru CASCADE;
DROP TABLE IF EXISTS nilai CASCADE;
DROP TABLE IF EXISTS tugas_submissions CASCADE;
DROP TABLE IF EXISTS tugas CASCADE;
DROP TABLE IF EXISTS materi CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('guru', 'siswa')),
  tingkat INTEGER CHECK (tingkat IN (10, 11, 12)),
  nama_kelas TEXT,
  nis TEXT,
  nip TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. MATERI TABLE
-- ============================================
CREATE TABLE materi (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  tingkat INTEGER NOT NULL CHECK (tingkat IN (10, 11, 12)),
  nama_kelas TEXT NOT NULL,
  mapel TEXT NOT NULL DEFAULT 'Sejarah' CHECK (mapel IN ('Sejarah', 'STL')),
  semester TEXT NOT NULL DEFAULT 'Ganjil' CHECK (semester IN ('Ganjil', 'Genap')),
  tp TEXT CHECK (tp IN ('TP1', 'TP2', 'TP3', 'TP4')),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TUGAS TABLE
-- ============================================
CREATE TABLE tugas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  file_url TEXT,
  file_name TEXT,
  tingkat INTEGER NOT NULL CHECK (tingkat IN (10, 11, 12)),
  nama_kelas TEXT NOT NULL,
  mapel TEXT NOT NULL DEFAULT 'Sejarah' CHECK (mapel IN ('Sejarah', 'STL')),
  semester TEXT NOT NULL DEFAULT 'Ganjil' CHECK (semester IN ('Ganjil', 'Genap')),
  tp TEXT CHECK (tp IN ('TP1', 'TP2', 'TP3', 'TP4')),
  kategori TEXT NOT NULL DEFAULT 'Tugas' CHECK (kategori IN ('Tugas', 'Ulangan Harian', 'UTS', 'UAS', 'Praktik')),
  deadline TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TUGAS SUBMISSIONS TABLE
-- ============================================
CREATE TABLE tugas_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tugas_id UUID REFERENCES tugas(id) ON DELETE CASCADE,
  siswa_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  catatan TEXT,
  checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ,
  nilai INTEGER CHECK (nilai >= 0 AND nilai <= 100),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tugas_id, siswa_id)
);

-- ============================================
-- 5. NILAI TABLE
-- ============================================
CREATE TABLE nilai (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  siswa_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tingkat INTEGER NOT NULL CHECK (tingkat IN (10, 11, 12)),
  nama_kelas TEXT NOT NULL,
  mapel TEXT NOT NULL DEFAULT 'Sejarah' CHECK (mapel IN ('Sejarah', 'STL')),
  semester TEXT NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
  tp TEXT CHECK (tp IN ('TP1', 'TP2', 'TP3', 'TP4')),
  kategori TEXT NOT NULL DEFAULT 'Ulangan Harian',
  judul TEXT NOT NULL,
  nilai DECIMAL(5,2) NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
  keterangan TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. DOKUMEN GURU TABLE (Prota, Prosem, RPP)
-- ============================================
CREATE TABLE dokumen_guru (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  judul TEXT NOT NULL,
  tipe TEXT NOT NULL CHECK (tipe IN ('prota', 'prosem', 'rpp')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  tingkat INTEGER NOT NULL CHECK (tingkat IN (10, 11, 12)),
  nama_kelas TEXT NOT NULL,
  mapel TEXT NOT NULL DEFAULT 'Sejarah' CHECK (mapel IN ('Sejarah', 'STL')),
  semester TEXT NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
  tahun_ajaran TEXT NOT NULL,
  tp TEXT CHECK (tp IN ('TP1', 'TP2', 'TP3', 'TP4')),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE tugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tugas_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokumen_guru ENABLE ROW LEVEL SECURITY;

-- PROFILES policies (non-recursive)
CREATE POLICY "Anyone authenticated can view profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow insert during signup" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- MATERI policies
CREATE POLICY "Everyone can view materi" ON materi FOR SELECT USING (true);
CREATE POLICY "Guru can insert materi" ON materi FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
);
CREATE POLICY "Guru can update own materi" ON materi FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Guru can delete own materi" ON materi FOR DELETE USING (created_by = auth.uid());

-- TUGAS policies
CREATE POLICY "Everyone can view tugas" ON tugas FOR SELECT USING (true);
CREATE POLICY "Guru can insert tugas" ON tugas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
);
CREATE POLICY "Guru can update own tugas" ON tugas FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Guru can delete own tugas" ON tugas FOR DELETE USING (created_by = auth.uid());

-- TUGAS_SUBMISSIONS policies
CREATE POLICY "Guru can view all submissions" ON tugas_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
);
CREATE POLICY "Siswa can view own submissions" ON tugas_submissions FOR SELECT USING (siswa_id = auth.uid());
CREATE POLICY "Siswa can insert own submissions" ON tugas_submissions FOR INSERT WITH CHECK (siswa_id = auth.uid());
CREATE POLICY "Siswa can update own submissions" ON tugas_submissions FOR UPDATE USING (siswa_id = auth.uid());
CREATE POLICY "Guru can update submissions" ON tugas_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
);

-- NILAI policies
CREATE POLICY "Guru can do everything with nilai" ON nilai FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
);
CREATE POLICY "Siswa can view own nilai" ON nilai FOR SELECT USING (siswa_id = auth.uid());

-- DOKUMEN_GURU policies
CREATE POLICY "Guru can do everything with dokumen" ON dokumen_guru FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('materi', 'materi', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('tugas', 'tugas', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('dokumen', 'dokumen', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id IN ('materi', 'tugas', 'submissions', 'dokumen', 'avatars'));
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, role, tingkat, nama_kelas, nis, nip)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'siswa'),
    (NEW.raw_user_meta_data->>'tingkat')::INTEGER,
    NEW.raw_user_meta_data->>'nama_kelas',
    NEW.raw_user_meta_data->>'nis',
    NEW.raw_user_meta_data->>'nip'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
