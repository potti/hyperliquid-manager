// 验证 API URL 配置
console.log('=== 验证 API URL 配置 ===\n');

// 模拟环境变量
process.env.NEXT_PUBLIC_API_URL = 'https://hyperstar.dpdns.org/api/v1';

// 模拟 API 客户端逻辑
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

console.log('1. 环境变量检查:');
console.log(`   NEXT_PUBLIC_API_URL = "${process.env.NEXT_PUBLIC_API_URL}"`);
console.log(`   API_BASE_URL = "${API_BASE_URL}"`);
console.log('');

// 验证 URL 格式
console.log('2. URL 格式验证:');
const expectedUrl = 'https://hyperstar.dpdns.org/api/v1';
if (API_BASE_URL === expectedUrl) {
  console.log(`   ✅ 正确: ${API_BASE_URL}`);
} else {
  console.log(`   ❌ 错误: ${API_BASE_URL}`);
  console.log(`       期望: ${expectedUrl}`);
}
console.log('');

// 测试 API 端点拼接
console.log('3. API 端点拼接测试:');
const testEndpoints = [
  '/api/users',
  '/api/v1/collection',
  '/api/v1/tag-enum',
  '/api/v1/copy-trading/historical-fills',
  '/api/v1/market/klines'
];

testEndpoints.forEach(endpoint => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`   ${endpoint}`);
  console.log(`     → ${fullUrl}`);
  
  // 检查是否有双斜杠问题
  if (fullUrl.includes('//api/')) {
    console.log('     ⚠️ 警告: URL 中有双斜杠');
  }
});
console.log('');

// 验证 Nginx 代理路径
console.log('4. Nginx 代理路径验证:');
console.log('   前端请求: https://hyperstar.dpdns.org/api/v1/api/users');
console.log('   Nginx 配置: location /api/ { proxy_pass http://127.0.0.1:9090/; }');
console.log('   实际后端接收: http://127.0.0.1:9090/api/v1/api/users');
console.log('');
console.log('   注意: 前端请求路径需要去掉重复的 "/api"');
console.log('   建议: API 客户端应该请求 "/v1/users" 而不是 "/api/v1/users"');
console.log('');

console.log('=== 验证完成 ===');