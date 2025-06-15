import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      claude: !!process.env.CLAUDE_API_KEY,
      storage: true
    }
  };

  const allServicesHealthy = Object.values(health.services).every(service => service);
  const httpStatus = allServicesHealthy ? 200 : 503;

  res.status(httpStatus).json(health);
});

export default router;