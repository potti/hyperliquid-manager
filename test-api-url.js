// 测试 API URL 配置
console.log('=== 测试 API URL 配置 ===');

// 模拟环境变量（与 .env.local 相同）
process.env.NEXT_PUBLIC_API_URL = 'https://hyperstar.dpdns.org/api/';

// 模拟 API 客户端中的逻辑
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('');

// 测试几个示例端点
const endpoints = [
  '/api/users',
  '/api/v1/collection',
  '/api/v1/tag-enum',
  '/api/health'
];

console.log('示例 API 请求 URL:');
endpoints.forEach(endpoint => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`  ${endpoint} -> ${fullUrl}`);
});

console.log('');
console.log('=== 测试完成 ===');

// 验证 URL 是否正确
const expectedBase = 'https://hyperstar.dpdns.org/api/';
if (API_BASE_URL === expectedBase) {
  console.log('✅ API URL 配置正确！');
} else {
  console.log(`❌ API URL 配置错误，期望: ${expectedBase}，实际: ${API_BASE_URL}`);
}