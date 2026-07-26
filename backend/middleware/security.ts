import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { RequestHandler } from "express";

// CORS Configuration: Only allow the app's own origin in production
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) {
      return callback(null, true);
    }

    const rawAllowed = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.APP_URL,
      process.env.ALLOWED_ORIGIN,
      process.env.CORS_ORIGIN,
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
    ];

    const allowedOrigins = rawAllowed
      .filter(Boolean)
      .flatMap((item) => (item as string).split(","))
      .map((item) => item.trim().replace(/\/$/, ""))
      .filter(Boolean);

    // Allow subdomains of the app domain, github.io sites, onrender.com sites, or exact matches
    const cleanOrigin = origin.replace(/\/$/, "");
    const isAllowed =
      cleanOrigin.endsWith(".github.io") ||
      cleanOrigin.endsWith(".onrender.com") ||
      cleanOrigin === "https://github.io" ||
      allowedOrigins.some((allowed) => {
        try {
          const allowedUrl = new URL(allowed.includes("://") ? allowed : `https://${allowed}`);
          const originUrl = new URL(cleanOrigin);
          return (
            originUrl.hostname === allowedUrl.hostname ||
            originUrl.hostname.endsWith("." + allowedUrl.hostname)
          );
        } catch {
          return allowed === cleanOrigin;
        }
      });

    if (isAllowed || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS security policy"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Express Rate Limiters: Prevents spam and brute-force attacks
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Limit each IP to 10 form submissions per hour
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    error: "Too many contact submissions from this IP. Please try again in an hour to protect against spam.",
  },
});

// Export combined security middlewares
export const securityMiddlewares: RequestHandler[] = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:"],
        frameAncestors: ["'self'", "https://ai.studio", "https://*.google.com"],
      },
    },
  }) as unknown as RequestHandler,
  cors(corsOptions) as unknown as RequestHandler,
];
