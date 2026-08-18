const http = require('http');

const makeRequest = (path, method, body, token) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.headers['Content-Length'] = data.length;

    const req = http.request(options, (res) => {
      let result = '';
      res.on('data', d => result += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(result) });
        } catch(e) {
          resolve({ status: res.statusCode, data: result });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
};

(async () => {
  try {
    const email = `test_profile_${Date.now()}@example.com`;
    console.log('Testing Registration...');
    const regRes = await makeRequest('/api/auth/register', 'POST', { name: 'Test', email, password: 'Password123' });
    console.log(regRes.status);
    const token = regRes.data?.data?.token;

    if (!token) {
      console.log('No token obtained', regRes);
      return;
    }

    console.log('Testing Profile Update...');
    const updateRes = await makeRequest('/api/users/me', 'PATCH', { 
      username: `user_${Date.now()}`, 
      bio: 'Hello world', 
      interests: ['Food', 'Travel'],
      discoveryRadius: 10
    }, token);
    console.log('Update status:', updateRes.status);
    if (updateRes.status !== 200) {
      console.log('Update error:', updateRes.data);
    }
    console.log('Update bio:', updateRes.data?.data?.user?.bio);
    console.log('Completion %:', updateRes.data?.data?.completionPercentage);

    console.log('Testing Location Update...');
    const locRes = await makeRequest('/api/users/me/location', 'PATCH', { 
      latitude: 10.123, 
      longitude: 76.123 
    }, token);
    console.log('Loc status:', locRes.status);
    console.log('Location:', locRes.data?.data?.user?.location);
    console.log('Completion %:', locRes.data?.data?.completionPercentage);
    
  } catch(e) {
    console.error(e);
  }
})();
