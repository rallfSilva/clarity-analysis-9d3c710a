-- Create Storage buckets for documents, reports, exports, and system assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('reports', 'reports', false, 52428800, ARRAY['application/pdf']),
  ('exports', 'exports', false, 104857600, ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json']),
  ('system', 'system', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- RLS Policies for documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

-- RLS Policies for reports bucket
CREATE POLICY "Users can view their own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reports' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "System can create reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports');

-- RLS Policies for exports bucket (admin only)
CREATE POLICY "Admins can manage exports"
ON storage.objects FOR ALL
USING (bucket_id = 'exports' AND has_role(auth.uid(), 'admin'));

-- RLS Policies for system bucket (public read, admin write)
CREATE POLICY "Anyone can view system assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'system');

CREATE POLICY "Admins can upload system assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'system' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'system' AND has_role(auth.uid(), 'admin'));

-- Add index for better performance on analyses queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Enable realtime for analyses table
ALTER PUBLICATION supabase_realtime ADD TABLE analyses;