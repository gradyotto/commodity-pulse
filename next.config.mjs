

const nextConfig = {
  async headers() {
    return [
      {
        // Allow embedding as iframe from any origin
        source: "/embed",
        headers: [{ key: "X-Frame-Options", value: "ALLOWALL" }],
      },
    ];
  },
};

export default nextConfig;
