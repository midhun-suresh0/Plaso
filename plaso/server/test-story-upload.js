const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
  try {
    const dummyImagePath = path.join(__dirname, 'dummy.jpg');
    fs.writeFileSync(dummyImagePath, 'dummy content');

    const email = `test_${Date.now()}@example.com`;
    // Register
    const registerRes = await axios.post('http://localhost:5000/api/auth/register', {
      email,
      password: 'Password123!',
      name: 'Test User'
    });
    const token = registerRes.data.data.token;

    // Upload
    const form = new FormData();
    form.append('storyMedia', fs.createReadStream(dummyImagePath), {
      filename: 'dummy.jpg',
      contentType: 'image/jpeg'
    });
    form.append('authorType', 'USER');
    form.append('mediaType', 'IMAGE');

    const uploadRes = await axios.post('http://localhost:5000/api/stories', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Upload success:', uploadRes.data);
  } catch (error) {
    if (error.response) {
      console.error('Upload failed with status', error.response.status, error.response.data);
    } else {
      console.error('Upload failed:', error.message);
    }
  }
}

testUpload();
