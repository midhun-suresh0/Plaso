const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src/screens');
const servicesDir = path.join(__dirname, 'src/services/api');

function replaceInFile(filePath, searchRegex, replaceWith) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(searchRegex, replaceWith);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

// 1. Fix orderApi.ts patch argument
replaceInFile(
  path.join(servicesDir, 'orderApi.ts'),
  /api\.patch<ApiResponse<\{ order: Order \}>>\(`\/orders\/\$\{orderId\}\/complete`\)/g,
  "api.patch<ApiResponse<{ order: Order }>>(`/orders/${orderId}/complete`, {})"
);

// 2. Fix PlasoChip usage in all screens
const screens = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));
screens.forEach(screen => {
  const p = path.join(screensDir, screen);
  let content = fs.readFileSync(p, 'utf8');
  
  // Replace <PlasoChip label={...} color={...} variant="..." size="..." />
  // with <PlasoChip label={...} style={{ backgroundColor: ... }} />
  content = content.replace(/<PlasoChip\s+label=\{([^}]+)\}\s+color=\{([^}]+)\}\s+variant="[^"]+"\s*(?:size="[^"]+"\s*)?\/>/g, 
    '<PlasoChip label={$1} style={{ backgroundColor: $2, borderColor: $2 }} />');
  
  // Also for non-solid ones if any
  content = content.replace(/<PlasoChip\s+label=\{([^}]+)\}\s+color=\{([^}]+)\}\s+variant="outline"\s*\/>/g, 
    '<PlasoChip label={$1} style={{ borderColor: $2 }} />');

  // Add Alert to ListingDetailsScreen if not present
  if (screen === 'ListingDetailsScreen.tsx') {
    if (!content.includes('Alert,')) {
      content = content.replace('ActivityIndicator,', 'ActivityIndicator,\n  Alert,');
    }
  }

  // Fix response.data -> response.data! for cartApi/orderApi
  // We look for `response.data.cart` and replace with `response.data!.cart`
  content = content.replace(/response\.data\.cart/g, 'response.data!.cart');
  content = content.replace(/response\.data\.orders/g, 'response.data!.orders');
  content = content.replace(/response\.data\.order/g, 'response.data!.order');

  fs.writeFileSync(p, content, 'utf8');
});

console.log('Fixes applied');
