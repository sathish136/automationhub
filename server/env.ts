import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
}

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');