import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import commentRoutes from './routes/comment.routes';
import notificationRoutes from './routes/notification.routes';
import searchRoutes from './routes/search.routes';
import discoveryRoutes from './routes/discovery.routes';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', discoveryRoutes); // Mount before userRoutes to avoid /:id conflict
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
