import express, { Application, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import careerRoutes from './routes/career.routes';
import inquiryRoutes from './routes/inquiry.routes';
import { connectDB } from './config/connectDB';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/user_routes/user.routes';
import cookieParser from 'cookie-parser';
import { RoleBasedRequest } from './utils/types';
import downloadRoutes from './routes/download.routes';



const app: Application = express();
const PORT = process.env.PORT || 5000;



const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

app.set('trust proxy', 1);

app.use(globalLimiter);


// Middlewares
// app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

const allowedOrigins = [
  process.env.CLIENT_FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL
];

// Configure CORS
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/user', userRoutes)
app.use('/api/careers', careerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/download', downloadRoutes)


app.get("/api/health-check", (_req: RoleBasedRequest, res: Response) => {
    res.status(200).json({
        ok: true,
        message: "Server is up and running!",
        timestamp: new Date()
    });
});

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