const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fitness API',
      version: '1.0.0',
      description: 'API for fitness app frontend',
    },
  },
  apis: ['./index.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const USERS_FILE = './users.json';
const RESERVATIONS_FILE = './reservations.json';

const DATA_FILE = './data.json';

function readData() {
  if (!fs.existsSync(DATA_FILE)) return { activities: [], instructors: [], classes: [] };
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
}

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

function readReservations() {
  if (!fs.existsSync(RESERVATIONS_FILE)) return [];
  const data = fs.readFileSync(RESERVATIONS_FILE);
  return JSON.parse(data);
}

function writeReservations(reservations) {
  fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(reservations, null, 2));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/register', async (req, res) => {
  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Register a new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: All fields are required
   *       409:
   *         description: Username already exists
   */
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ message: 'Username already exists.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, email, password: hashedPassword });
  writeUsers(users);
  res.status(201).json({ message: 'User registered successfully.' });
});

app.post('/login', async (req, res) => {
  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Login user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       400:
   *         description: Username and password required
   *       401:
   *         description: Invalid credentials
   */
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required.' });
  }
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  // Generate simple token (for demo only)
  const token = Buffer.from(username).toString('base64');
  res.json({ message: 'Login successful.', token });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// API untuk kebutuhan frontend

// GET /activities
app.get('/activities', (req, res) => {
  /**
   * @swagger
   * /activities:
   *   get:
   *     summary: Get all activities
   *     responses:
   *       200:
   *         description: List of activities
   */
  const data = readData();
  res.json(data.activities);
});

// GET /instructors
app.get('/instructors', (req, res) => {
  /**
   * @swagger
   * /instructors:
   *   get:
   *     summary: Get all instructors
   *     responses:
   *       200:
   *         description: List of instructors
   */
  const data = readData();
  res.json(data.instructors);
});

// GET /classes/nearby
app.get('/classes/nearby', (req, res) => {
  /**
   * @swagger
   * /classes/nearby:
   *   get:
   *     summary: Get nearby classes
   *     responses:
   *       200:
   *         description: List of nearby classes
   */
  const data = readData();
  res.json(data.classes);
});

// GET /classes/:id (detail kelas)
app.get('/classes/:id', (req, res) => {
  /**
   * @swagger
   * /classes/{id}:
   *   get:
   *     summary: Get class detail
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Class detail
   *       404:
   *         description: Class not found
   */
  const classId = parseInt(req.params.id);
  const data = readData();
  const kelas = data.classes.find(c => c.id === classId);
  if (!kelas) {
    return res.status(404).json({ message: 'Class not found.' });
  }
  res.json(kelas);
});

// POST /classes/:id/reserve
app.post('/classes/:id/reserve', (req, res) => {
  /**
   * @swagger
   * /classes/{id}/reserve:
   *   post:
   *     summary: Reserve a class (requires login)
   *     description: You must login first and use the token in the Authorization header.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *     responses:
   *       200:
   *         description: Reservation successful
   *       400:
   *         description: No slots available
   *       401:
   *         description: Unauthorized. Please login.
   *       404:
   *         description: Class not found
   */
  // Swagger security definition
  /**
   * @swagger
   * components:
   *   securitySchemes:
   *     bearerAuth:
   *       type: http
   *       scheme: bearer
   *       bearerFormat: JWT
   */
  const classId = parseInt(req.params.id);
  const authHeader = req.headers['authorization'];

    // Expect: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization format.' });
    }

    const token = parts[1]; // token TANPA "Bearer"

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized. Please login.' });
  }
  // Decode token (for demo, just base64 username)
  let username;
  try {
    username = Buffer.from(token, 'base64').toString('utf8');
  } catch {
    return res.status(401).json({ message: 'Invalid token.' });
  }
  const users = readUsers();
  if (!users.find(u => u.username === username)) {
    return res.status(401).json({ message: 'Invalid user.' });
  }
  const data = readData();
  const kelas = data.classes.find(c => c.id === classId);
  if (!kelas) {
    return res.status(404).json({ message: 'Class not found.' });
  }
  if (kelas.slots <= 0) {
    return res.status(400).json({ message: 'No slots available.' });
  }
  kelas.slots -= 1;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  // Simpan reservasi ke reservations.json
  const reservations = readReservations();
  reservations.push({ username, classId, reservedAt: new Date().toISOString() });
  writeReservations(reservations);
  res.json({ message: 'Reservation successful.', slotsLeft: kelas.slots });
});
