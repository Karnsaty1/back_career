const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

// Set dynamic port
const PORT =  8080; 

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://vercel.live',
          'https://vercel.live/_next-live/feedback/feedback.js',
        ],
        scriptSrcElem: [
          "'self'",
          'https://vercel.live',
          'https://vercel.live/_next-live/feedback/feedback.js',
        ],
        connectSrc: ["'self'", 'https://vercel.live'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  })
);

const corsOptions = {
  origin: [process.env.FRONTEND_URL,'http://localhost:3000','https://carrer-front-seven.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 

app.use(express.json());
app.use(cookieParser());

const { connectDB } = require('./db');
connectDB()
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  });

app.use('/user/auth', require('./Routes/Auth'));
app.use('/user/data', require('./Routes/Data'));

app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});


app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).send('Something went wrong!');
});

module.exports = app;
