-- RLS for event flyer images in the private "event-images" bucket.
-- Files live under a folder named after the owner's user id: <uid>/<file>
CREATE POLICY "event_images_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'event-images');

CREATE POLICY "event_images_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "event_images_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "event_images_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);