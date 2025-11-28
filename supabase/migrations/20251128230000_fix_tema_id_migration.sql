-- Migrar dados: preencher tema_id baseado no slug
-- Para registros criados pelo ChatAdmin que não tinham tema_id

UPDATE user_permissions up
SET tema_id = t.id
FROM temas t
WHERE LOWER(up.tema) = LOWER(t.slug)
  AND up.tema_id IS NULL;
