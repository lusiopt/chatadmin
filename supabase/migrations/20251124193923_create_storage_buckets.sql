-- Create storage buckets for ChatAdmin

-- Bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for channel/group icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'channel-icons',
    'channel-icons',
    true,
    1048576, -- 1MB
    ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for icon library (58 PNG icons)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'icon-library',
    'icon-library',
    true,
    524288, -- 512KB
    ARRAY['image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage policies for channel-icons bucket
CREATE POLICY "Public can view channel icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'channel-icons');

CREATE POLICY "Authenticated users can upload channel icons"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'channel-icons'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update channel icons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'channel-icons' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete channel icons"
ON storage.objects FOR DELETE
USING (bucket_id = 'channel-icons' AND auth.role() = 'authenticated');

-- Storage policies for icon-library bucket
CREATE POLICY "Public can view icon library"
ON storage.objects FOR SELECT
USING (bucket_id = 'icon-library');

CREATE POLICY "Service role can manage icon library"
ON storage.objects FOR ALL
USING (bucket_id = 'icon-library' AND auth.role() = 'service_role');
