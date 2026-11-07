require('dotenv').config();
const http = require('http');
const app = require('../app');

let server;
const PORT = 3999;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Comprehensive API & Web Integration Tests ---');
  server = app.listen(PORT);

  try {
    // 1. Health & DB connection
    console.log('\n[1] Testing GET /api/status...');
    const statusRes = await request('GET', '/api/status');
    console.log('Status code:', statusRes.status);
    console.log('Database connected:', statusRes.body.database && statusRes.body.database.connected);
    if (statusRes.status !== 200 || !statusRes.body.database.connected) {
      throw new Error('Database is not connected in /api/status');
    }

    // 2. GET /api/resources
    console.log('\n[2] Testing GET /api/resources...');
    const listRes = await request('GET', '/api/resources');
    console.log('Status code:', listRes.status);
    console.log('Resources count:', Array.isArray(listRes.body) ? listRes.body.length : 'not an array');
    if (listRes.status !== 200 || !Array.isArray(listRes.body) || listRes.body.length === 0) {
      throw new Error('GET /api/resources did not return an array with data');
    }

    // 3. GET /api/resources with filters
    console.log('\n[3] Testing GET /api/resources?subject=Mathematics&difficulty=Beginner...');
    const filterRes = await request('GET', '/api/resources?subject=Mathematics&difficulty=Beginner');
    console.log('Filtered resources count:', filterRes.body.length);
    console.log('Sample title:', filterRes.body[0]?.title);

    // 4. POST /api/resources (Create)
    console.log('\n[4] Testing POST /api/resources (Create)...');
    const newResource = {
      title: 'Automated Test Resource - PostgreSQL Integration',
      subject: 'Computer Science',
      keyword: 'test, verification, postgres, crud',
      difficulty: 'Intermediate',
      resource_type: 'Documentation',
      description: 'Temporary resource generated during automated CRUD test run.',
      url: 'https://example.com/test-resource'
    };
    const createRes = await request('POST', '/api/resources', newResource);
    console.log('Status code:', createRes.status);
    console.log('Created ID:', createRes.body?.data?.id);
    if (createRes.status !== 201 || !createRes.body?.data?.id) {
      throw new Error('Failed to create resource');
    }
    const createdId = createRes.body.data.id;

    // 5. GET /api/resources/:id
    console.log(`\n[5] Testing GET /api/resources/${createdId}...`);
    const getOneRes = await request('GET', `/api/resources/${createdId}`);
    console.log('Status code:', getOneRes.status);
    console.log('Title matches:', getOneRes.body?.title === newResource.title);
    if (getOneRes.status !== 200 || getOneRes.body?.id !== createdId) {
      throw new Error('Failed to retrieve created resource');
    }

    // 6. PUT /api/resources/:id (Update)
    console.log(`\n[6] Testing PUT /api/resources/${createdId} (Update)...`);
    const updatePayload = {
      ...newResource,
      title: 'Updated Automated Test Resource',
      difficulty: 'Advanced'
    };
    const updateRes = await request('PUT', `/api/resources/${createdId}`, updatePayload);
    console.log('Status code:', updateRes.status);
    console.log('Updated title:', updateRes.body?.data?.title);
    console.log('Updated difficulty:', updateRes.body?.data?.difficulty);
    if (updateRes.status !== 200 || updateRes.body?.data?.title !== 'Updated Automated Test Resource') {
      throw new Error('Failed to update resource');
    }

    // 7. DELETE /api/resources/:id (Delete)
    console.log(`\n[7] Testing DELETE /api/resources/${createdId} (Delete)...`);
    const deleteRes = await request('DELETE', `/api/resources/${createdId}`);
    console.log('Status code:', deleteRes.status);
    console.log('Deleted title:', deleteRes.body?.data?.title);
    if (deleteRes.status !== 200) {
      throw new Error('Failed to delete resource');
    }

    // 8. Verify 404 after deletion
    console.log(`\n[8] Testing GET /api/resources/${createdId} (Expect 404)...`);
    const notFoundRes = await request('GET', `/api/resources/${createdId}`);
    console.log('Status code (expected 404):', notFoundRes.status);
    if (notFoundRes.status !== 404) {
      throw new Error('Resource still exists after deletion');
    }

    // 9. Validation error test (Expect 400)
    console.log('\n[9] Testing POST /api/resources with invalid payload (Expect 400)...');
    const badPayload = { title: '', url: 'not-a-url' };
    const badRes = await request('POST', '/api/resources', badPayload);
    console.log('Status code (expected 400):', badRes.status);
    console.log('Error message:', badRes.body?.message);
    if (badRes.status !== 400) {
      throw new Error('Expected 400 validation error for invalid payload');
    }

    // 10. POST /api/recommendations with DB resources
    console.log('\n[10] Testing POST /api/recommendations...');
    const recRes = await request('POST', '/api/recommendations', {
      history: [
        {
          subject: 'Computer Science',
          keyword: 'database sql',
          difficulty: 'Intermediate'
        }
      ]
    });
    console.log('Status code:', recRes.status);
    console.log('Source:', recRes.body?.source);
    console.log('Recommendations count:', recRes.body?.recommendations?.length);
    console.log('Top recommendation:', recRes.body?.recommendations?.[0]?.title);
    if (recRes.status !== 200 || recRes.body?.source !== 'postgresql') {
      throw new Error('Recommendations endpoint did not use postgresql source');
    }

    // 11. Test Web Routes render EJS views properly
    console.log('\n[11] Testing EJS View Routes...');
    const pages = ['/', '/resources', '/manage', '/history'];
    for (const page of pages) {
      const pageRes = await request('GET', page);
      console.log(`GET ${page} -> HTTP ${pageRes.status}`);
      if (pageRes.status !== 200) {
        throw new Error(`Page ${page} failed to render (HTTP ${pageRes.status})`);
      }
    }

    console.log('\n========================================');
    console.log(' ALL 11 TESTS PASSED SUCCESSFULLY! ');
    console.log('========================================');
  } catch (err) {
    console.error('\nTest failed with error:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    const { pool } = require('../config/db');
    await pool.end();
  }
}

runTests();
