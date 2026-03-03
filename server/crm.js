// ============================================================
//  CRM API — все маршруты административной панели
// ============================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'barbershop_crm_secret_2024';

// ─── Middleware: проверка JWT ────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Нет токена' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  next();
}

// ─── AUTH ────────────────────────────────────────────────────
// POST /crm/auth/login
router.post('/auth/login', async (req, res) => {
  const { login, password } = req.body;
  const pool = req.app.locals.pool;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM crm_users WHERE login = $1 AND active = true', [login]
    );
    if (!rows.length) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const token = jwt.sign(
      { id: user.id, login: user.login, role: user.role, name: user.name, master_id: user.master_id },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, login: user.login, role: user.role, name: user.name, master_id: user.master_id } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /crm/auth/me
router.get('/auth/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// ─── DASHBOARD ───────────────────────────────────────────────
// GET /crm/dashboard
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const today = new Date().toISOString().split('T')[0];
    const [todayR, totalC, monthR, revenue] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM appointments WHERE appointment_date = $1 AND status != 'cancelled'", [today]),
      pool.query("SELECT COUNT(*) FROM clients"),
      pool.query("SELECT COUNT(*) FROM appointments WHERE appointment_date >= date_trunc('month', CURRENT_DATE) AND status != 'cancelled'"),
      pool.query("SELECT COALESCE(SUM(s.price),0) as total FROM appointments a JOIN services s ON a.service_id = s.id WHERE date_trunc('month', a.appointment_date::date) = date_trunc('month', CURRENT_DATE) AND a.status = 'done'"),
    ]);
    res.json({
      today_appointments: parseInt(todayR.rows[0].count),
      total_clients: parseInt(totalC.rows[0].count),
      month_appointments: parseInt(monthR.rows[0].count),
      month_revenue: parseFloat(revenue.rows[0].total),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── APPOINTMENTS ────────────────────────────────────────────
// GET /crm/appointments?date=&master_id=&status=&page=&limit=
router.get('/appointments', auth, async (req, res) => {
  const pool = req.app.locals.pool;
  const { date, master_id, status, page = 1, limit = 50 } = req.query;
  try {
    let where = [];
    let params = [];
    let i = 1;

    // мастер видит только свои записи
    if (req.user.role === 'master') {
      where.push(`a.master_id = $${i++}`);
      params.push(req.user.master_id);
    } else if (master_id) {
      where.push(`a.master_id = $${i++}`);
      params.push(master_id);
    }

    if (date) { where.push(`a.appointment_date = $${i++}`); params.push(date); }
    if (status) { where.push(`a.status = $${i++}`); params.push(status); }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(`
      SELECT a.id, TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
             TO_CHAR(a.appointment_time, 'HH24:MI') as appointment_time,
             a.status, a.notes,
             c.name as client_name, c.phone as client_phone, c.id as client_id,
             m.name as master_name, m.id as master_id,
             s.name as service_name, s.price, s.duration_minutes
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN masters m ON a.master_id = m.id
      JOIN services s ON a.service_id = s.id
      ${whereStr}
      ORDER BY a.appointment_date DESC, a.appointment_time ASC
      LIMIT $${i++} OFFSET $${i++}
    `, [...params, limit, offset]);

    // скрываем телефон для мастеров
    const result = rows.map(r => ({
      ...r,
      client_phone: req.user.role === 'master' ? undefined : r.client_phone
    }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /crm/appointments — создать вручную
router.post('/appointments', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, phone, email, master_id, service_id, date, time, notes } = req.body;
  try {
    // проверяем занятость
    const conflict = await pool.query(
      "SELECT id FROM appointments WHERE master_id=$1 AND appointment_date=$2 AND appointment_time=$3 AND status NOT IN ('cancelled')",
      [master_id, date, time]
    );
    if (conflict.rows.length) return res.status(409).json({ error: 'Это время уже занято' });

    // находим или создаём клиента
    let client = await pool.query('SELECT id FROM clients WHERE phone=$1', [phone]);
    let clientId;
    if (client.rows.length) {
      clientId = client.rows[0].id;
    } else {
      const ins = await pool.query(
        'INSERT INTO clients(name, phone, email) VALUES($1,$2,$3) RETURNING id',
        [name, phone, email || null]
      );
      clientId = ins.rows[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO appointments(client_id, master_id, service_id, appointment_date, appointment_time, status, notes, source)
       VALUES($1,$2,$3,$4,$5,'confirmed',$6,'manual') RETURNING id`,
      [clientId, master_id, service_id, date, time, notes || null]
    );
    res.json({ appointment_id: rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /crm/appointments/:id — изменить статус / заметку
router.patch('/appointments/:id', auth, async (req, res) => {
  const pool = req.app.locals.pool;
  const { status, notes } = req.body;
  try {
    // мастер может менять только свои записи
    let check = '';
    let params = [];
    if (req.user.role === 'master') {
      check = 'AND master_id = (SELECT id FROM masters WHERE id = $2)';
      params = [req.params.id, req.user.master_id];
    } else {
      params = [req.params.id];
    }

    const sets = [];
    if (status) sets.push(`status = '${status}'`);
    if (notes !== undefined) sets.push(`notes = '${notes.replace(/'/g,"''")}'`);
    if (!sets.length) return res.status(400).json({ error: 'Нечего обновлять' });

    await pool.query(
      `UPDATE appointments SET ${sets.join(', ')} WHERE id = $1 ${check}`,
      params
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /crm/appointments/:id
router.delete('/appointments/:id', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    await pool.query("UPDATE appointments SET status='cancelled' WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── CLIENTS ─────────────────────────────────────────────────
// GET /crm/clients?search=&master_id=&service_id=&page=
router.get('/clients', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { search, page = 1, limit = 30 } = req.query;
  try {
    let where = [];
    let params = [];
    let i = 1;
    if (search) {
      where.push(`(c.name ILIKE $${i} OR c.phone ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(`
      SELECT c.*,
        COUNT(a.id) as visit_count,
        TO_CHAR(MAX(a.appointment_date), 'YYYY-MM-DD') as last_visit,        COALESCE(SUM(s.price) FILTER (WHERE a.status='done'), 0) as total_spent
      FROM clients c
      LEFT JOIN appointments a ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      ${whereStr}
      GROUP BY c.id
      ORDER BY MAX(a.appointment_date) DESC NULLS LAST
      LIMIT $${i++} OFFSET $${i++}
    `, [...params, limit, offset]);

    const countRes = await pool.query(`SELECT COUNT(*) FROM clients c ${whereStr}`, params);
    res.json({ clients: rows, total: parseInt(countRes.rows[0].count) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /crm/clients/:id — детальная карточка клиента
router.get('/clients/:id', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const client = await pool.query('SELECT * FROM clients WHERE id=$1', [req.params.id]);
    if (!client.rows.length) return res.status(404).json({ error: 'Клиент не найден' });

    const history = await pool.query(`
      SELECT a.id, TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
             TO_CHAR(a.appointment_time, 'HH24:MI') as appointment_time,
             a.status, a.notes,
             m.name as master_name, s.name as service_name, s.price
      FROM appointments a
      JOIN masters m ON a.master_id = m.id
      JOIN services s ON a.service_id = s.id
      WHERE a.client_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.params.id]);

    res.json({ client: client.rows[0], history: history.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── MASTERS (управление) ────────────────────────────────────
// GET /crm/masters
router.get('/masters', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const { rows } = await pool.query('SELECT * FROM masters ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /crm/masters
router.post('/masters', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, specialty, bio, photo_url, work_schedule } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO masters(name, specialty, bio, photo_url, work_schedule, active)
       VALUES($1,$2,$3,$4,$5,true) RETURNING *`,
      [name, specialty, bio || null, photo_url || null, work_schedule || '5/2']
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /crm/masters/:id
router.patch('/masters/:id', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, specialty, bio, photo_url, work_schedule, active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE masters SET name=COALESCE($1,name), specialty=COALESCE($2,specialty),
       bio=COALESCE($3,bio), photo_url=COALESCE($4,photo_url),
       work_schedule=COALESCE($5,work_schedule), active=COALESCE($6,active)
       WHERE id=$7 RETURNING *`,
      [name, specialty, bio, photo_url, work_schedule, active, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── SERVICES (управление) ───────────────────────────────────
// GET /crm/services
router.get('/services', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const { rows } = await pool.query('SELECT * FROM services ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /crm/services
router.post('/services', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, description, price, duration_minutes } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO services(name,description,price,duration_minutes,active) VALUES($1,$2,$3,$4,true) RETURNING *',
      [name, description || null, price, duration_minutes]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /crm/services/:id
router.patch('/services/:id', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, description, price, duration_minutes, active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE services SET name=COALESCE($1,name), description=COALESCE($2,description),
       price=COALESCE($3,price), duration_minutes=COALESCE($4,duration_minutes), active=COALESCE($5,active)
       WHERE id=$6 RETURNING *`,
      [name, description, price, duration_minutes, active, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /crm/services/:id
router.delete('/services/:id', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    await pool.query('UPDATE services SET active=false WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── CRM USERS (сотрудники) ──────────────────────────────────
// GET /crm/users
router.get('/users', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const { rows } = await pool.query(
      'SELECT id, login, name, role, master_id, active FROM crm_users ORDER BY id'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /crm/users
router.post('/users', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { login, password, name, role, master_id } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO crm_users(login,password_hash,name,role,master_id,active) VALUES($1,$2,$3,$4,$5,true) RETURNING id,login,name,role,master_id',
      [login, hash, name, role, master_id || null]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Логин уже занят' });
    res.status(500).json({ error: e.message });
  }
});

// PATCH /crm/users/:id
router.patch('/users/:id', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { password, name, role, master_id, active } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE crm_users SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
    }
    await pool.query(
      `UPDATE crm_users SET name=COALESCE($1,name), role=COALESCE($2,role),
       master_id=COALESCE($3,master_id), active=COALESCE($4,active) WHERE id=$5`,
      [name, role, master_id, active, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /crm/users/:id
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    await pool.query('UPDATE crm_users SET active=false WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── MAILING ────────────────────────────────────────────────
// POST /crm/mailing/send
router.post('/mailing/send', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  const { subject, body, segment } = req.body; // segment: 'all' | 'inactive_30'
  try {
    let query = "SELECT id, name, email FROM clients WHERE email IS NOT NULL AND email != ''";
    if (segment === 'inactive_30') {
      query += ` AND id NOT IN (
        SELECT DISTINCT client_id FROM appointments
        WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      )`;
    }
    const { rows } = await pool.query(query);

    // Сохраняем рассылку в лог
    await pool.query(
      'INSERT INTO mailing_log(subject, body, segment, recipients_count, sent_at) VALUES($1,$2,$3,$4,NOW())',
      [subject, body, segment, rows.length]
    );

    // В реальном проекте здесь вызов nodemailer / SendGrid
    // Сейчас возвращаем кол-во получателей
    res.json({ ok: true, recipients: rows.length, message: `Рассылка поставлена в очередь для ${rows.length} получателей` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /crm/mailing/logs
router.get('/mailing/logs', auth, adminOnly, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const { rows } = await pool.query('SELECT * FROM mailing_log ORDER BY sent_at DESC LIMIT 20');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
