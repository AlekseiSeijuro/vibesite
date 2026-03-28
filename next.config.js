/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.yandexcloud.net',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Страницы приложения
        source: '/((?!api/site).*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://storage.yandexcloud.net https://*.supabase.co https://images.unsplash.com",
              "connect-src 'self' https://*.supabase.co https://routerai.ru https://api.yookassa.ru",
              "frame-src 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Клиентские сайты — максимально открытые заголовки
        // чтобы сгенерированный HTML мог грузить любые ресурсы
        source: '/api/site/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Robots-Tag',           value: 'index, follow' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src *",
              "script-src 'self' 'unsafe-inline'",
              "style-src * 'unsafe-inline'",
              "img-src * data: blob:",
              "font-src * data:",
              "connect-src *",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
