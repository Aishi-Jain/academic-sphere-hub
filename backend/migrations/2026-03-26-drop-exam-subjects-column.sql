SET @subjects_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'exams'
    AND COLUMN_NAME = 'subjects'
);

SET @drop_subjects_sql = IF(
  @subjects_column_exists > 0,
  'ALTER TABLE exams DROP COLUMN subjects',
  'SELECT 1'
);

PREPARE drop_subjects_stmt FROM @drop_subjects_sql;
EXECUTE drop_subjects_stmt;
DEALLOCATE PREPARE drop_subjects_stmt;
