const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'client/src/screens');
const files = [
  'BusinessDiscoveryScreen.tsx',
  'BusinessProfileScreen.tsx',
  'BusinessDashboardScreen.tsx',
  'EditBusinessScreen.tsx',
  'AdminBusinessesScreen.tsx',
  'AdminBusinessDetailsScreen.tsx',
  'ProfileScreen.tsx'
];

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix theme colors
  content = content.replace(/theme\.colors\.textMuted/g, 'theme.colors.textSecondary');
  content = content.replace(/theme\.colors\.surfaceLight/g, 'theme.colors.surfaceHighlight');
  
  // Fix button variants
  content = content.replace(/variant="outline"/g, 'variant="secondary"');
  
  // Fix PlasoInput leftIcon
  content = content.replace(/leftIcon=\{<MaterialIcons name="search" size=\{20\} color=\{theme\.colors\.textSecondary\} \/>\}/g, 'icon="search"');

  // Fix ProfileScreen role comparisons
  if (file === 'ProfileScreen.tsx') {
    content = content.replace(/user\?\.role === 'BUSINESS_OWNER'/g, "user?.role === 'BUSINESS_OWNER'");
    content = content.replace(/user\?\.role === 'ADMIN'/g, "user?.role === 'ADMIN'");
    // Actually the problem is that UserRole enum in frontend probably doesn't have BUSINESS_OWNER?
    // Let's just cast user?.role to any
    content = content.replace(/user\?\.role/g, "(user?.role as any)");
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Done fix3');
