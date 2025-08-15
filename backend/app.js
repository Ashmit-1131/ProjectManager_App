const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./utils/errors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/project-manager app for youngmind is running now', (req, res) => res.json({ ok: true }));

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;