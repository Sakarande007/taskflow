import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: 50,                   // 50 auth attempts during dev (tighten to 10 in prod)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
    error: true,
    success: false,
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min window
  max: 200,            // 200 req/min during dev (tighten to 120 in prod)
  message: {
    message: "Rate limit exceeded. Slow down.",
    error: true,
    success: false,
  },
});
