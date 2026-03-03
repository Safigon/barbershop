-- ============================================================
--  CRM Migration — добавляем таблицы для административной панели
-- ============================================================

-- Таблица пользователей CRM (администраторы и мастера)
CREATE TABLE IF NOT EXISTS crm_users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'master', -- 'admin' | 'master'
  master_id INTEGER REFERENCES masters(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Лог рассылок
CREATE TABLE IF NOT EXISTS mailing_log (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255),
  body TEXT,
  segment VARCHAR(50),
  recipients_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Добавляем колонку source в appointments если её нет
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'online';

-- Добавляем колонку notes в appointments если её нет  
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
--  Создаём администратора по умолчанию
--  логин: admin  пароль: admin123
-- ============================================================
INSERT INTO crm_users (login, password_hash, name, role)
VALUES (
  'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'Администратор',
  'admin'
) ON CONFLICT (login) DO NOTHING;
