/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@react-pdf/renderer",
      "pdfkit",
      "fontkit",
      "linebreak",
      "png-js",
    ],
    outputFileTracingIncludes: {
      "/api/invoices/[invoiceId]/pdf": ["./node_modules/pdfkit/**/*"],
      "/api/public/invoice/[token]/pdf": ["./node_modules/pdfkit/**/*"],
      "/[orgSlug]/invoices/[invoiceId]": ["./node_modules/pdfkit/**/*"],
    },
  },
};

export default nextConfig;
