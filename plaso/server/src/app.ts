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
import businessRoutes from './routes/business.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import messageRoutes from './routes/message.routes';
import storyRoutes from './routes/story.routes';
import recommendationRoutes from './routes/recommendation.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Middleware
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf.toString();
  }
}));
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', discoveryRoutes); // Mount before userRoutes to avoid /:id conflict
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
