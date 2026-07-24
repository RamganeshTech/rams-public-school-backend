import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import careerRoutes from './routes/career.routes';
import inquiryRoutes from './routes/inquiry.routes';
import { connectDB } from './config/connectDB';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/careers', careerRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Health check
app.get('/', (_req, res) => {
  res.status(200).json({ message: 'School backend is running' });
});

// Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});