require('dotenv').config({ path: 'd:/Khatabook_clone/backend/.env' });
const mongoose = require('mongoose');
const User = require('d:/Khatabook_clone/backend/models/User');

const RAW_URI = "mongodb://khatabook_admin:khatabook123@ac-k8wwaqj-shard-00-00.bilojvc.mongodb.net:27017,ac-k8wwaqj-shard-00-01.bilojvc.mongodb.net:27017,ac-k8wwaqj-shard-00-02.bilojvc.mongodb.net:27017/khatabook?ssl=true&replicaSet=atlas-p2qoi0-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  try {
    console.log('Connecting via legacy TCP...');
    await mongoose.connect(RAW_URI, { serverSelectionTimeoutMS: 5000 });
    const existing = await User.findOne({ phone: '9016007312' });
    if (existing) {
        console.log('User already exists! Credentials: phone 9016007312, password: password123');
    } else {
        const user = await User.create({
            name: 'Aryan Raval',
            phone: '9016007312',
            password: 'password123',
            pin: '1234'
        });
        console.log('✅ User successfully created safely from the backend!');
    }
  } catch(e) {
    console.error('Error creating user:', e.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
