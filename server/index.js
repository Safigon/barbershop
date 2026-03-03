const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const crmRouter = require('./crm');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/barbershop'
});

// ─── INIT DB ────────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS masters (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      photo_url TEXT,
      description TEXT,
      specialty VARCHAR(100),
      experience VARCHAR(50),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL,
      description TEXT,
      active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS work_schedules (
      id SERIAL PRIMARY KEY,
      master_id INTEGER REFERENCES masters(id),
      day_of_week INTEGER, -- 0=Mon, 6=Sun
      start_time TIME,
      end_time TIME,
      is_day_off BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      email VARCHAR(100),
      first_visit DATE,
      last_visit DATE,
      total_spent INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id),
      master_id INTEGER REFERENCES masters(id),
      service_id INTEGER REFERENCES services(id),
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      comment TEXT,
      source VARCHAR(20) DEFAULT 'website',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS salon_settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) UNIQUE NOT NULL,
      value TEXT
    );
  `);

  // Seed data
  const mastersCount = await pool.query('SELECT COUNT(*) FROM masters');
  if (parseInt(mastersCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO masters (name, photo_url, description, specialty, experience) VALUES
      ('Александр Петров', 'https://i.pravatar.cc/300?img=11', 'Мастер высшей категории. Специализируется на классических мужских стрижках и уходе за бородой.', 'Классические стрижки', '8 лет'),
      ('Дмитрий Волков', 'https://i.pravatar.cc/300?img=12', 'Эксперт по современным fade-стрижкам. Работает с любым типом волос.', 'Fade & Modern', '5 лет'),
      ('Максим Соколов', 'https://i.pravatar.cc/300?img=13', 'Мастер по работе с бородой и усами. Сделает из вас настоящего джентльмена.', 'Борода & Усы', '6 лет');
    `);

    await pool.query(`
      INSERT INTO services (name, price, duration_minutes, description) VALUES
      ('Мужская стрижка', 800, 45, 'Классическая или современная стрижка под ваш образ'),
      ('Стрижка + борода', 1200, 75, 'Комплексный уход: стрижка и оформление бороды'),
      ('Оформление бороды', 600, 30, 'Стрижка, моделирование и уход за бородой'),
      ('Детская стрижка', 600, 30, 'Стрижка для мальчиков до 12 лет'),
      ('Королевское бритьё', 1000, 45, 'Бритьё опасной бритвой с горячим полотенцем'),
      ('Укладка волос', 500, 30, 'Профессиональная укладка с использованием премиальных средств');
    `);

    // Work schedules Mon-Sat for each master
    for (let masterId = 1; masterId <= 3; masterId++) {
      for (let day = 0; day <= 5; day++) {
        await pool.query(
          `INSERT INTO work_schedules (master_id, day_of_week, start_time, end_time) VALUES ($1, $2, '10:00', '20:00')`,
          [masterId, day]
        );
      }
      // Sunday off
      await pool.query(
        `INSERT INTO work_schedules (master_id, day_of_week, is_day_off) VALUES ($1, 6, true)`,
        [masterId]
      );
    }

    await pool.query(`
      INSERT INTO salon_settings (key, value) VALUES
      ('salon_name', 'BLADE & STYLE'),
      ('phone', '+7 (999) 123-45-67'),
      ('address', 'г. Москва, ул. Барберская, 15'),
      ('open_from', '10:00'),
      ('open_to', '21:00'),
      ('instagram', '@blade_style'),
      ('about', 'BLADE & STYLE — premium барбершоп в сердце города. Мы создаём не просто стрижки — мы создаём образ.');
    `);
  }
// CRM миграция
await pool.query(`
  CREATE TABLE IF NOT EXISTS crm_users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'master',
    master_id INTEGER REFERENCES masters(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS mailing_log (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255),
    body TEXT,
    segment VARCHAR(50),
    recipients_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP DEFAULT NOW()
  );
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'online';
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
  INSERT INTO crm_users (login, password_hash, name, role)
  VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Администратор', 'admin')
  ON CONFLICT (login) DO NOTHING;
`);
  console.log('✅ DB initialized');
}

initDB().catch(console.error);
app.locals.pool = pool;
app.use('/crm', crmRouter);

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// GET /api/masters
app.get('/api/masters', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM masters WHERE active = true ORDER BY id');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/services
app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services WHERE active = true ORDER BY price');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM salon_settings');
    const settings = {};
    result.rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/slots?master_id=1&date=2024-01-15
app.get('/api/slots', async (req, res) => {
  const { master_id, date } = req.query;
  if (!master_id || !date) return res.status(400).json({ error: 'master_id and date required' });

  try {
    const dateObj = new Date(date);
    const dayOfWeek = (dateObj.getDay() + 6) % 7; // Convert to Mon=0

    const schedule = await pool.query(
      'SELECT * FROM work_schedules WHERE master_id = $1 AND day_of_week = $2',
      [master_id, dayOfWeek]
    );

    if (!schedule.rows.length || schedule.rows[0].is_day_off) {
      return res.json({ slots: [], day_off: true });
    }

    const { start_time, end_time } = schedule.rows[0];
    const startHour = parseInt(start_time.split(':')[0]);
    const endHour = parseInt(end_time.split(':')[0]);

    // Get booked slots
    const booked = await pool.query(
      `SELECT a.appointment_time, s.duration_minutes 
       FROM appointments a 
       JOIN services s ON a.service_id = s.id
       WHERE a.master_id = $1 AND a.appointment_date = $2 AND a.status != 'cancelled'`,
      [master_id, date]
    );

    const bookedTimes = new Set();
    booked.rows.forEach(b => {
      const [h, m] = b.appointment_time.split(':').map(Number);
      const dur = b.duration_minutes;
      for (let i = 0; i < dur; i += 30) {
        const slotMinutes = h * 60 + m + i;
        bookedTimes.add(`${Math.floor(slotMinutes/60)}:${slotMinutes%60 === 0 ? '00' : '30'}`);
      }
    });

    const slots = [];
    for (let h = startHour; h < endHour; h++) {
      ['00', '30'].forEach(m => {
        const timeStr = `${h}:${m}`;
        const displayTime = `${h.toString().padStart(2,'0')}:${m}`;
        const now = new Date();
        const slotDate = new Date(`${date}T${displayTime}:00`);
        if (slotDate > now && !bookedTimes.has(timeStr)) {
          slots.push(displayTime);
        }
      });
    }

    res.json({ slots, day_off: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/appointments
app.post('/api/appointments', async (req, res) => {
  const { name, phone, email, master_id, service_id, date, time, sms_reminder } = req.body;

  if (!name || !phone || !master_id || !service_id || !date || !time) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check slot is still free (race condition protection)
    const conflict = await client.query(
      `SELECT id FROM appointments 
       WHERE master_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != 'cancelled'`,
      [master_id, date, time]
    );

    if (conflict.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Это время уже занято. Пожалуйста, выберите другое.' });
    }

    // Upsert client
    let clientId;
    const existingClient = await client.query('SELECT id FROM clients WHERE phone = $1', [phone]);
    if (existingClient.rows.length > 0) {
      clientId = existingClient.rows[0].id;
      await client.query('UPDATE clients SET last_visit = $1 WHERE id = $2', [date, clientId]);
    } else {
      const newClient = await client.query(
        'INSERT INTO clients (name, phone, email, first_visit, last_visit) VALUES ($1, $2, $3, $4, $4) RETURNING id',
        [name, phone, email || null, date]
      );
      clientId = newClient.rows[0].id;
    }

    const service = await client.query('SELECT price FROM services WHERE id = $1', [service_id]);
    const price = service.rows[0]?.price || 0;

    // Create appointment
    const appt = await client.query(
      `INSERT INTO appointments (client_id, master_id, service_id, appointment_date, appointment_time, status, source)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'website') RETURNING id`,
      [clientId, master_id, service_id, date, time]
    );

    // Update total spent
    await client.query('UPDATE clients SET total_spent = total_spent + $1 WHERE id = $2', [price, clientId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      appointment_id: appt.rows[0].id,
      message: 'Вы успешно записаны! Ждём вас.'
    });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Временный endpoint для миграции — удалить после использования
app.get('/run-migration', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crm_users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(200) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'master',
        master_id INTEGER REFERENCES masters(id) ON DELETE SET NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS mailing_log (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(255),
        body TEXT,
        segment VARCHAR(50),
        recipients_count INTEGER DEFAULT 0,
        sent_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'online';
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
      INSERT INTO crm_users (login, password_hash, name, role)
      VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Администратор', 'admin')
      ON CONFLICT (login) DO NOTHING;
    `);
    res.json({ ok: true, message: 'Миграция выполнена!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
