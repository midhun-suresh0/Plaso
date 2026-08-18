const fs = require('fs');
const path = require('path');

const fixApiFiles = () => {
  const dir = path.join(__dirname, 'client/src/services');
  
  // businessApi.ts
  const bApi = path.join(dir, 'businessApi.ts');
  if (fs.existsSync(bApi)) {
    let content = fs.readFileSync(bApi, 'utf8');
    // Replace api.get(`/businesses/admin/list`, { params: { status, page } });
    content = content.replace(
      /api\.get\(\`\/businesses\/admin\/list\`,\s*\{\s*params:\s*\{\s*status,\s*page\s*\}\s*\}\)/g,
      "api.get(`/businesses/admin/list?status=${status || ''}&page=${page}`)"
    );
    fs.writeFileSync(bApi, content, 'utf8');
  }

  // businessDiscoveryApi.ts
  const bDiscovery = path.join(dir, 'businessDiscoveryApi.ts');
  if (fs.existsSync(bDiscovery)) {
    let content = fs.readFileSync(bDiscovery, 'utf8');
    
    // Replace:
    /*
    const params: any = { lng: longitude, lat: latitude, radius };
    if (category) {
      params.category = category;
    }
    const response = await api.get('/businesses/nearby', { params });
    */
    content = content.replace(
      /const params: any = \{ lng: longitude, lat: latitude, radius \};\s*if \(category\) \{\s*params\.category = category;\s*\}\s*const response = await api\.get\('\/businesses\/nearby', \{ params \}\);/g,
      "const qs = new URLSearchParams({ lng: longitude.toString(), lat: latitude.toString(), radius: radius.toString() });\n    if (category) qs.append('category', category);\n    const response = await api.get(`/businesses/nearby?${qs.toString()}`);"
    );

    // Replace:
    /*
    const params: any = { q, page, limit };
    if (category) {
      params.category = category;
    }
    const response = await api.get('/businesses/search', { params });
    */
    content = content.replace(
      /const params: any = \{ q, page, limit \};\s*if \(category\) \{\s*params\.category = category;\s*\}\s*const response = await api\.get\('\/businesses\/search', \{ params \}\);/g,
      "const qs = new URLSearchParams({ q, page: page.toString(), limit: limit.toString() });\n    if (category) qs.append('category', category);\n    const response = await api.get(`/businesses/search?${qs.toString()}`);"
    );

    fs.writeFileSync(bDiscovery, content, 'utf8');
  }
};

fixApiFiles();
console.log('Fixed API files');
