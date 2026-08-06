require('dotenv').config();
require('express-async-errors');

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDb = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const hydrationRoutes = require('./routes/hydrationRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Adaptive Hydration Tracker Application' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hydration', hydrationRoutes);

app.use(errorHandler);

const startServer = async () => {
  await connectDb();
  const server = app.listen(PORT, HOST, () => {
    console.log(`Hydration Tracker backend is running on http://${HOST}:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`💡 Tip: Run 'taskkill /F /IM node.exe' in PowerShell/CMD to stop existing Node processes.\n`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
};

startServer().catch((err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});


