import app from './app';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {    
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n===================================`);
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`===================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();