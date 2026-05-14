ALTER TABLE service_categories
ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#0f766e';

UPDATE service_categories
SET color = CASE name
  WHEN 'Nghi phep & cham cong' THEN '#2563eb'
  WHEN 'Bang luong & phuc loi' THEN '#b7791f'
  WHEN 'Thiet bi & tai khoan' THEN '#be3455'
  WHEN 'Tuyen dung & hoi nhap' THEN '#7c3aed'
  WHEN 'Ho tro kinh doanh' THEN '#0f766e'
  ELSE color
END;
