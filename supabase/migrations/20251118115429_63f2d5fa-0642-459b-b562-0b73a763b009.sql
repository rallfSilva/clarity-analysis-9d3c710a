-- Permitir que usuários excluam suas próprias análises
CREATE POLICY "Users can delete their own analyses"
ON public.analyses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que admins excluam qualquer análise
CREATE POLICY "Admins can delete any analysis"
ON public.analyses
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Permitir que usuários atualizem suas próprias análises
CREATE POLICY "Users can update their own analyses"
ON public.analyses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir que admins atualizem qualquer análise
CREATE POLICY "Admins can update any analysis"
ON public.analyses
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));