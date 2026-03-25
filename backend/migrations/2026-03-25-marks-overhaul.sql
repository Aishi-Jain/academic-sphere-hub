<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
-- Marks module overhaul migration
-- Run in a maintenance window and verify existing data before enforcing NOT NULL constraints.

ALTER TABLE subjects
  ADD COLUMN year TINYINT NULL,
  ADD COLUMN regulation VARCHAR(3) NULL;

ALTER TABLE students
  ADD COLUMN regulation VARCHAR(3) NULL;

ALTER TABLE marks
  ADD COLUMN mid1 DECIMAL(5,2) NULL,
  ADD COLUMN mid2 DECIMAL(5,2) NULL,
  ADD COLUMN ppt DECIMAL(5,2) NULL,
  ADD COLUMN total DECIMAL(6,2) NULL;

-- Optional: drop old marks column once migration to component marks is complete.
-- ALTER TABLE marks DROP COLUMN marks;

-- Recommended constraints/indexes.
ALTER TABLE marks
  ADD UNIQUE KEY unique_student_subject (student_id, subject_id);

ALTER TABLE subjects
  ADD INDEX idx_subject_filters (regulation, year, department_id, semester);

ALTER TABLE students
  ADD INDEX idx_student_marks_filters (regulation, year, department_id, section);

-- Conservative backfill placeholders for legacy subjects.
UPDATE subjects SET regulation = COALESCE(regulation, 'R22') WHERE regulation IS NULL;
UPDATE subjects SET year = COALESCE(year, 1) WHERE year IS NULL;

-- Enforce required columns after backfill.
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
-- Marks module overhaul migration (idempotent-friendly)
-- MySQL 8.x

-- ---------- subjects.year ----------
SET @has_subjects_year := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subjects'
    AND COLUMN_NAME = 'year'
);
SET @sql := IF(
  @has_subjects_year = 0,
  'ALTER TABLE subjects ADD COLUMN year TINYINT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- subjects.regulation ----------
SET @has_subjects_regulation := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subjects'
    AND COLUMN_NAME = 'regulation'
);
SET @sql := IF(
  @has_subjects_regulation = 0,
  'ALTER TABLE subjects ADD COLUMN regulation VARCHAR(3) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- students.regulation ----------
SET @has_students_regulation := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'regulation'
);
SET @sql := IF(
  @has_students_regulation = 0,
  'ALTER TABLE students ADD COLUMN regulation VARCHAR(3) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- marks component columns ----------
SET @has_marks_mid1 := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marks'
    AND COLUMN_NAME = 'mid1'
);
SET @sql := IF(
  @has_marks_mid1 = 0,
  'ALTER TABLE marks ADD COLUMN mid1 DECIMAL(5,2) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_marks_mid2 := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marks'
    AND COLUMN_NAME = 'mid2'
);
SET @sql := IF(
  @has_marks_mid2 = 0,
  'ALTER TABLE marks ADD COLUMN mid2 DECIMAL(5,2) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_marks_ppt := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marks'
    AND COLUMN_NAME = 'ppt'
);
SET @sql := IF(
  @has_marks_ppt = 0,
  'ALTER TABLE marks ADD COLUMN ppt DECIMAL(5,2) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_marks_total := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marks'
    AND COLUMN_NAME = 'total'
);
SET @sql := IF(
  @has_marks_total = 0,
  'ALTER TABLE marks ADD COLUMN total DECIMAL(6,2) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- indexes (skip if already present) ----------
SET @has_unique_student_subject := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marks'
    AND INDEX_NAME = 'unique_student_subject'
);
SET @sql := IF(
  @has_unique_student_subject = 0,
  'ALTER TABLE marks ADD UNIQUE KEY unique_student_subject (student_id, subject_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_subject_filters := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subjects'
    AND INDEX_NAME = 'idx_subject_filters'
);
SET @sql := IF(
  @has_idx_subject_filters = 0,
  'ALTER TABLE subjects ADD INDEX idx_subject_filters (regulation, year, department_id, semester)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_student_marks_filters := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'students'
    AND INDEX_NAME = 'idx_student_marks_filters'
);
SET @sql := IF(
  @has_idx_student_marks_filters = 0,
  'ALTER TABLE students ADD INDEX idx_student_marks_filters (regulation, year, department_id, section)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Optional: drop old marks column once migration to component marks is complete.
-- ALTER TABLE marks DROP COLUMN marks;

-- ---------- backfill for subjects to avoid NOT NULL alter failure ----------
SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;
UPDATE subjects
SET regulation = COALESCE(regulation, 'R22')
WHERE regulation IS NULL AND subject_id IS NOT NULL;
UPDATE subjects
SET year = COALESCE(year, 1)
WHERE year IS NULL AND subject_id IS NOT NULL;
SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;

-- ---------- enforce required columns after successful backfill ----------
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
ALTER TABLE subjects
  MODIFY COLUMN regulation VARCHAR(3) NOT NULL,
  MODIFY COLUMN year TINYINT NOT NULL;
