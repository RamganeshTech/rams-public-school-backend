import rateLimit from 'express-rate-limit';

// Strict limiter for public form submissions (careers apply, inquiries)
export const submitFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: 'Too many submissions from this device. Please try again later.',
  },
});

// Looser limiter for authenticated admin GET routes
export const adminReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // generous, just guards against abuse/loops
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: 'Too many requests. Please slow down.',
  },
});