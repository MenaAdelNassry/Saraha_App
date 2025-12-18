import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import messagesRoutes from './routes/message.routes';
import { globalErrorHandler } from './middlewares/error.middleware';
import morgan from 'morgan';

const app = express();

// Middlewares
if(process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
    console.log(`✅ Morgan enabled: ${process.env.NODE_ENV} mode`);
} else {
    app.use(morgan("combined"));
}
app.use(helmet()); // Security headers
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messagesRoutes);

// Test Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Saraha Backend is working like a Boss! 🚀' });
});

app.use(globalErrorHandler);

export default app;