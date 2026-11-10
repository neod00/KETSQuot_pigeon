import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/outlook/sam-outlook.xml', headers: [
      { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
      { key: 'Content-Disposition', value: 'attachment; filename="sam-outlook.xml"' },
    ] }];
  },
};

export default nextConfig;
