const mongoose = require('mongoose');
const settings = require('../settings');

module.exports = testEnv => {
  const dbName = settings.db + (testEnv ? '-test' : '');

  mongoose.connect('mongodb://localhost/' + dbName, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    serverSelectionTimeoutMS: 3000,
  }).catch(err => {
    console.warn('[database] MongoDB not available - running without database features');
  });
  mongoose.set('useCreateIndex', true);

  const db = mongoose.connection;
  db.on('connected', console.log.bind(console, '[database] Connected to MongoDB.'));
  db.on('error', (err) => {
    console.warn('[database] MongoDB connection error - stats tracking disabled');
  });
};