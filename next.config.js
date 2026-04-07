function getRemotePatterns() {
  const patterns = [
    { protocol: "http", hostname: "127.0.0.1" },
    { protocol: "http", hostname: "localhost" },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return patterns;
  }

  try {
    const url = new URL(supabaseUrl);
    patterns.push({
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
    });
  } catch {
    console.warn("Invalid NEXT_PUBLIC_SUPABASE_URL; skipping remote image host setup.");
  }

  return patterns;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: getRemotePatterns(),
  },
};

module.exports = nextConfig;
