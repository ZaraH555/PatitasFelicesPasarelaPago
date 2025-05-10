module.exports = {
  database: {
    host: 'localhost',
    user: 'root',
    password: '',
    name: 'patitas_felices'
  },
  stripe: {
    publishableKey: 'pk_test_...', // Add your test publishable key
    // Secret key should be in .env file only
  },
  server: {
    port: 3000
  }
};
