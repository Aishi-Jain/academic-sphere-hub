CREATE TABLE IF NOT EXISTS invigilation_cycles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  year TINYINT NOT NULL,
  semester TINYINT NOT NULL,
  booking_deadline DATETIME NOT NULL,
  status ENUM('draft', 'published', 'closed', 'generated') NOT NULL DEFAULT 'draft',
  created_by VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invigilation_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycle_id INT NOT NULL,
  session_order INT NOT NULL,
  exam_date DATE NOT NULL,
  session_type ENUM('FN', 'AN') NOT NULL,
  source_exam_id INT DEFAULT NULL,
  occupied_room_count INT NOT NULL DEFAULT 0,
  capacity_slots INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invigilation_sessions_cycle
    FOREIGN KEY (cycle_id) REFERENCES invigilation_cycles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_sessions_exam
    FOREIGN KEY (source_exam_id) REFERENCES exams(exam_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invigilation_timetable_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycle_id INT NOT NULL,
  session_id INT NOT NULL,
  department_id INT NOT NULL,
  subject_id INT DEFAULT NULL,
  subject_label_snapshot VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invigilation_entries_cycle
    FOREIGN KEY (cycle_id) REFERENCES invigilation_cycles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_entries_session
    FOREIGN KEY (session_id) REFERENCES invigilation_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_entries_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_invigilation_entries_subject
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
    ON DELETE SET NULL,
  UNIQUE KEY uq_invigilation_entries_cycle_session_department (cycle_id, session_id, department_id)
);

CREATE TABLE IF NOT EXISTS invigilation_department_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycle_id INT NOT NULL,
  department_id INT NOT NULL,
  allocated_slots INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invigilation_slots_cycle
    FOREIGN KEY (cycle_id) REFERENCES invigilation_cycles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_slots_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON DELETE RESTRICT,
  UNIQUE KEY uq_invigilation_slots_cycle_department (cycle_id, department_id)
);

CREATE TABLE IF NOT EXISTS invigilation_hod_allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycle_id INT NOT NULL,
  faculty_id VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  required_slot_count INT NOT NULL DEFAULT 0,
  assigned_by_hod VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invigilation_hod_cycle
    FOREIGN KEY (cycle_id) REFERENCES invigilation_cycles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_hod_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_invigilation_hod_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_invigilation_hod_cycle_faculty (cycle_id, faculty_id)
);

CREATE TABLE IF NOT EXISTS invigilation_faculty_choices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycle_id INT NOT NULL,
  faculty_id VARCHAR(100) NOT NULL,
  session_id INT NOT NULL,
  chosen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invigilation_choices_cycle
    FOREIGN KEY (cycle_id) REFERENCES invigilation_cycles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_choices_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_choices_session
    FOREIGN KEY (session_id) REFERENCES invigilation_sessions(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_invigilation_choices_faculty_session (faculty_id, session_id)
);

CREATE TABLE IF NOT EXISTS invigilation_room_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycle_id INT NOT NULL,
  session_id INT NOT NULL,
  room_id INT NOT NULL,
  faculty_1_id VARCHAR(100) NOT NULL,
  faculty_2_id VARCHAR(100) NOT NULL,
  assignment_source ENUM('selected', 'auto_fill') NOT NULL DEFAULT 'selected',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invigilation_assignments_cycle
    FOREIGN KEY (cycle_id) REFERENCES invigilation_cycles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_assignments_session
    FOREIGN KEY (session_id) REFERENCES invigilation_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_invigilation_assignments_room
    FOREIGN KEY (room_id) REFERENCES classrooms(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_invigilation_assignments_faculty_1
    FOREIGN KEY (faculty_1_id) REFERENCES faculty(faculty_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_invigilation_assignments_faculty_2
    FOREIGN KEY (faculty_2_id) REFERENCES faculty(faculty_id)
    ON DELETE RESTRICT
);
