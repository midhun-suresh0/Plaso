async function runTests() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('1. Registering user...');
    const email = `test${Date.now()}@test.com`;
    let res = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email,
        password: 'password123',
        role: 'USER'
      })
    });
    let data = await res.json();
    
    const token = data.data.token;
    console.log('User registered. Token:', token.substring(0, 20) + '...');
    
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n2. Testing minimal valid post (PUBLIC)...');
    res = await fetch(`${baseURL}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: 'Test post from Plaso API',
        visibility: 'PUBLIC'
      })
    });
    console.log('Status:', res.status, 'Data:', await res.json());

    console.log('\n3. Testing post with location (NEARBY)...');
    res = await fetch(`${baseURL}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: 'Nearby test post',
        visibility: 'NEARBY',
        location: {
          longitude: 76.123,
          latitude: 10.123
        }
      })
    });
    console.log('Status:', res.status, 'Data:', await res.json());

    console.log('\n4. Testing post with image...');
    res = await fetch(`${baseURL}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        media: ['file:///path/to/image.jpg'],
        visibility: 'PUBLIC'
      })
    });
    console.log('Status:', res.status, 'Data:', await res.json());

    console.log('\n5. Testing invalid visibility (should fail)...');
    res = await fetch(`${baseURL}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: 'Bad visibility',
        visibility: 'INVALID'
      })
    });
    console.log('Status:', res.status, 'Data:', await res.json());

    console.log('\n6. Testing empty post (should fail)...');
    res = await fetch(`${baseURL}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visibility: 'PUBLIC'
      })
    });
    console.log('Status:', res.status, 'Data:', await res.json());

    console.log('\nAll tests completed.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
