/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // ✨ 추가: 'main' 폴더의 코드를 Next.js 빌드 시스템이 인식하고 컴파일하도록 설정
  // '../../main' 경로는 pages 폴더에서 main 폴더로 접근하는 상대 경로를 기반으로 합니다.
  transpilePackages: ['../../main'],
  webpack: (config) => {
    return config;
  },
};
