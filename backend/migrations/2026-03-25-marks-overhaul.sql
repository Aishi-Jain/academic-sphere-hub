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
ALTER TABLE subjects
  MODIFY COLUMN regulation VARCHAR(3) NOT NULL,
  MODIFY COLUMN year TINYINT NOT NULL;
