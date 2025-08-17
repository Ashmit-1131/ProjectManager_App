require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('Missing MONGO_URI'); process.exit(1); }
  await mongoose.connect(uri);
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(password, 10);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, passwordHash, role: 'admin' });
    console.log('Admin created:', email);
  } else {
    user.passwordHash = passwordHash;
    user.role = 'admin';
    await user.save();
    console.log('Admin reset:', email);
  }
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
