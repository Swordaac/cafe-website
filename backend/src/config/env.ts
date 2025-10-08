function getEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getList(name: string, fallback: string[] = []): string[] {
  const raw = process.env[name];
  if (!raw || raw.trim() === '') return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', '4000')),
  mongoUri: getEnv('MONGODB_URI'),
  supabaseJwtSecret: getEnv('SUPABASE_JWT_SECRET'),
  allowedOrigins: getList('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://localhost:3001', '*']),
  tenantStrategy: getEnv('TENANT_STRATEGY', 'header') as 'header' | 'subdomain' | 'path',
  tenantHeader: getEnv('TENANT_HEADER', 'x-tenant-id').toLowerCase(),
  baseDomain: getEnv('BASE_DOMAIN', 'localhost'),
  stripe: {
    secretKey: getEnv('STRIPE_SECRET_KEY', ''),
    webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET', ''),
    applicationFeeBps: Number(getEnv('STRIPE_APP_FEE_BPS', '1000')), // default 10%
    defaultCurrency: getEnv('STRIPE_DEFAULT_CURRENCY', 'usd'),
  },
  cloudinary: {
    cloudName: getEnv('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: getEnv('CLOUDINARY_API_KEY', ''),
    apiSecret: getEnv('CLOUDINARY_API_SECRET', ''),
  },
};




