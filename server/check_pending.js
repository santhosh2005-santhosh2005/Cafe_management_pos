const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/odoo_pos', { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection;
  const users = await db.collection('users').find({ isApproved: false }).toArray();
  console.log(users);
  process.exit(0);
}
main().catch(console.error);
