import express from 'express';
import { Request,Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL||"http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/', (req:Request, res:Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});


app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});