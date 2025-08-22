const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const projectRoutes = require('./routes/projects.routes');
const bugRoutes = require('./routes/bugs.routes');
const modulesRoutes = require('./routes/modules.routes'); // new

const { notFound, errorHandler } = require('./utils/errors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 200 });
app.use(limiter);

app.get('/Project_Manager_app', (req, res) => res.json({ ok: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1', bugRoutes); // includes /projects/:projectId/bugs and /bugs/:id
app.use('/api/v1', modulesRoutes); // modules routes mounted under same API prefix

app.use(notFound);
app.use(errorHandler);

module.exports = app;
