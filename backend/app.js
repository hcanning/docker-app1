// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const {
  DATABASE_URL = 'postgres://appuser:secretpassword@db:5432/appdb',
  JWT_SECRET = 'somesecretkey_change_me',
  PORT = 3000
} = process.env;

const client = new Client({ connectionString: DATABASE_URL });

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

async function connectDb() {
  await client.connect();
}
connectDb().catch(err => { console.error(err); process.exit(1); });

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.redirect('/login');
  }
}

// login routes
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const r = await client.query('SELECT id, username, password FROM users WHERE username=$1', [username]);
  if (r.rowCount === 0) return res.render('login', { error: 'Invalid credentials' });
  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.render('login', { error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'lax' });
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// CRUD routes (protected)
app.get('/', authMiddleware, async (req, res) => {
  const r = await client.query('SELECT * FROM notes ORDER BY created_at DESC');
  res.render('list', { notes: r.rows, user: req.user });
});

app.get('/new', authMiddleware, (req, res) => {
  res.render('form', { note: null });
});

app.post('/new', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  await client.query('INSERT INTO notes (title, content) VALUES ($1, $2)', [title, content]);
  res.redirect('/');
});

app.get('/edit/:id', authMiddleware, async (req, res) => {
  const r = await client.query('SELECT * FROM notes WHERE id=$1', [req.params.id]);
  if (r.rowCount === 0) return res.redirect('/');
  res.render('form', { note: r.rows[0] });
});

app.post('/edit/:id', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  await client.query('UPDATE notes SET title=$1, content=$2 WHERE id=$3', [title, content, req.params.id]);
  res.redirect('/');
});

app.post('/delete/:id', authMiddleware, async (req, res) => {
  await client.query('DELETE FROM notes WHERE id=$1', [req.params.id]);
  res.redirect('/');
});

// Health
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
