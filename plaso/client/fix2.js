const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src/services/api');

['cartApi.ts', 'orderApi.ts'].forEach(file => {
  const p = path.join(servicesDir, file);
  let content = fs.readFileSync(p, 'utf8');
  
  // Replace api.get<ApiResponse<{...}>> with api.get<{...}>
  content = content.replace(/api\.(get|post|patch|delete)<ApiResponse<([^>]+)>>/g, 'api.$1<$2>');
  // Also for empty ApiResponse
  content = content.replace(/api\.(get|post|patch|delete)<ApiResponse>/g, 'api.$1<undefined>');
  
  // Replace return response.data; with return response;
  content = content.replace(/return response\.data;/g, 'return response;');

  fs.writeFileSync(p, content, 'utf8');
});

// Also fix ListingDetailsScreen outline variant
const listingDetailsPath = path.join(__dirname, 'src/screens/ListingDetailsScreen.tsx');
let listingContent = fs.readFileSync(listingDetailsPath, 'utf8');
listingContent = listingContent.replace(/variant="outline"/g, 'variant="secondary"');
fs.writeFileSync(listingDetailsPath, listingContent, 'utf8');

// Also fix OrderDetailsScreen PlasoChip color
const orderDetailsPath = path.join(__dirname, 'src/screens/OrderDetailsScreen.tsx');
let orderContent = fs.readFileSync(orderDetailsPath, 'utf8');
orderContent = orderContent.replace(/<PlasoChip\s+label=\{([^}]+)\}\s+color=\{([^}]+)\}\s+variant="solid"\s*\/>/g, 
  '<PlasoChip label={$1} style={{ backgroundColor: $2, borderColor: $2 }} />');
orderContent = orderContent.replace(/<PlasoChip\s+label=\{([^}]+)\}\s+color=\{([^}]+)\}\s+variant="outline"\s*\/>/g, 
  '<PlasoChip label={$1} style={{ borderColor: $2 }} />');
fs.writeFileSync(orderDetailsPath, orderContent, 'utf8');

console.log('Fixes applied');
