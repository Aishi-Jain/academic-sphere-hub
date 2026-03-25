-- Normalize legacy semester values from 1..8 into within-year semester values 1 or 2.
-- Mapping: odd -> 1, even -> 2

SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

UPDATE students
SET semester = CASE
  WHEN semester IN (1, 2) THEN semester
  WHEN semester BETWEEN 1 AND 8 THEN IF(MOD(semester, 2) = 0, 2, 1)
  ELSE semester
END
WHERE semester IS NOT NULL;

UPDATE subjects
SET semester = CASE
  WHEN semester IN (1, 2) THEN semester
  WHEN semester BETWEEN 1 AND 8 THEN IF(MOD(semester, 2) = 0, 2, 1)
  ELSE semester
END
WHERE semester IS NOT NULL;

SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;

-- Optional hardening (run only after verifying no semester outside 1,2 remains):
-- ALTER TABLE students MODIFY COLUMN semester TINYINT NOT NULL;
-- ALTER TABLE subjects MODIFY COLUMN semester TINYINT NOT NULL;
