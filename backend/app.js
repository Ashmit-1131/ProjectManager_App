const express = require('express');
const cors = require('cors');


const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const projectRoutes = require('./routes/projects.routes');


const { notFound, errorHandler } = require('./utils/errors');

const app = express();
app.use(express.json());
app.use(cors());


app.get('/Project_Manager_app', (req, res) => res.json({ ok: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);


app.use(notFound);
app.use(errorHandler);

module.exports = app;
