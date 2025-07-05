  CREATE DATABASE medical_reminder_health_logger;

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS medications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    medication_date DATE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    time TIME NOT NULL,
    taken BOOLEAN DEFAULT FALSE,
    frequency VARCHAR(50),
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS medication_actions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    previous_taken BOOLEAN,
    new_taken BOOLEAN,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reverted BOOLEAN DEFAULT FALSE
  );

  CREATE INDEX IF NOT EXISTS idx_medication_actions_user_time ON medication_actions(user_id, action_time DESC);

  CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(50),
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS health_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    value NUMERIC NOT NULL,
    unit VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, metric_date);
  CREATE INDEX IF NOT EXISTS idx_health_metrics_type ON health_metrics(type);

  CREATE TABLE IF NOT EXISTS health_score (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    score_date DATE NOT NULL
  );



  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_medications_user_date ON medications(user_id, medication_date);
  CREATE INDEX IF NOT EXISTS idx_medications_user_taken ON medications(user_id, taken);
  CREATE INDEX IF NOT EXISTS idx_medications_time_range ON medications(user_id, start_date, end_date);
  CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(user_id, date, time);
  CREATE INDEX IF NOT EXISTS idx_health_score_user_date ON health_score(user_id, score_date);


  CREATE UNIQUE INDEX IF NOT EXISTS idx_health_score_user_date_unique ON health_score(user_id, score_date);

  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

