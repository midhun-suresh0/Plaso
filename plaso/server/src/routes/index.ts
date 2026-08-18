import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from './auth.routes';
import usersRouter from './user.routes';

const router = Router();

// Active routes
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);

// Future route modules (Phase 2+)
// router.use('/businesses', businessesRouter);
// router.use('/products', productsRouter);
// router.use('/posts', postsRouter);
// router.use('/communities', communitiesRouter);
// router.use('/reviews', reviewsRouter);
// router.use('/chat', chatRouter);
// router.use('/notifications', notificationsRouter);
// router.use('/search', searchRouter);
// router.use('/recommendations', recommendationsRouter);
// router.use('/location', locationRouter);

export default router;
