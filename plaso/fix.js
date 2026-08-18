const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'client/src/screens');
const files = [
  'BusinessDiscoveryScreen.tsx',
  'BusinessProfileScreen.tsx',
  'BusinessDashboardScreen.tsx',
  'EditBusinessScreen.tsx',
  'AdminBusinessesScreen.tsx',
  'AdminBusinessDetailsScreen.tsx'
];

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix imports
  content = content.replace(/import { AppStackParamList } from '\.\.\/navigation\/AppNavigator';/g, "import { RootStackParamList } from '../types';");
  content = content.replace(/AppStackParamList/g, 'RootStackParamList');
  
  content = content.replace(/import PlasoScreen from '\.\.\/components\/PlasoScreen';/g, "import { PlasoScreen } from '../components/PlasoScreen';");
  content = content.replace(/import PlasoInput from '\.\.\/components\/PlasoInput';/g, "import { PlasoInput } from '../components/PlasoInput';");
  content = content.replace(/import PlasoCard from '\.\.\/components\/PlasoCard';/g, "import { PlasoCard } from '../components/PlasoCard';");
  content = content.replace(/import PlasoButton from '\.\.\/components\/PlasoButton';/g, "import { PlasoButton } from '../components/PlasoButton';");

  content = content.replace(/import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '\.\.\/constants\/theme';/g, "import { theme } from '../constants/theme';");
  content = content.replace(/import { COLORS, TYPOGRAPHY, SPACING } from '\.\.\/constants\/theme';/g, "import { theme } from '../constants/theme';");
  
  content = content.replace(/import { useAppContext } from '\.\.\/context\/AppContext';/g, "import { useAuth } from '../context/AuthContext';");

  // Fix appContext usage
  content = content.replace(/const { location, discoveryRadius } = useAppContext\(\);/g, "const { user } = useAuth();\n  const location = user?.location?.coordinates ? { longitude: user.location.coordinates[0], latitude: user.location.coordinates[1] } : null;\n  const discoveryRadius = user?.discoveryRadius || 5;");
  content = content.replace(/const { location } = useAppContext\(\);/g, "const { user } = useAuth();\n  const location = user?.location?.coordinates ? { longitude: user.location.coordinates[0], latitude: user.location.coordinates[1] } : null;");
  content = content.replace(/const { user } = useAppContext\(\);/g, "const { user } = useAuth();");

  // Replace constants
  content = content.replace(/COLORS\./g, 'theme.colors.');
  content = content.replace(/SPACING\./g, 'theme.spacing.');
  content = content.replace(/RADIUS\./g, 'theme.radii.');
  
  // Typography replacements
  content = content.replace(/\.\.\.TYPOGRAPHY\.h1/g, "fontSize: 32, fontWeight: 'bold'");
  content = content.replace(/\.\.\.TYPOGRAPHY\.h2/g, "fontSize: 24, fontWeight: 'bold'");
  content = content.replace(/\.\.\.TYPOGRAPHY\.h3/g, "fontSize: 20, fontWeight: '600'");
  content = content.replace(/\.\.\.TYPOGRAPHY\.h4/g, "fontSize: 18, fontWeight: '600'");
  content = content.replace(/\.\.\.TYPOGRAPHY\.body1/g, "fontSize: 16");
  content = content.replace(/\.\.\.TYPOGRAPHY\.body2/g, "fontSize: 14");
  content = content.replace(/\.\.\.TYPOGRAPHY\.caption/g, "fontSize: 12");
  
  content = content.replace(/\.\.\.theme\.typography\.sizes\.h1/g, "fontSize: 32, fontWeight: 'bold'");
  content = content.replace(/\.\.\.theme\.typography\.sizes\.h2/g, "fontSize: 24, fontWeight: 'bold'");
  content = content.replace(/\.\.\.theme\.typography\.sizes\.h3/g, "fontSize: 20, fontWeight: '600'");
  content = content.replace(/\.\.\.theme\.typography\.sizes\.h4/g, "fontSize: 18, fontWeight: '600'");
  content = content.replace(/\.\.\.theme\.typography\.sizes\.body1/g, "fontSize: 16");
  content = content.replace(/\.\.\.theme\.typography\.sizes\.body2/g, "fontSize: 14");
  content = content.replace(/\.\.\.theme\.typography\.sizes\.caption/g, "fontSize: 12");

  content = content.replace(/theme\.radii\.round/g, 'theme.radii.full');
  
  // Fix TS data types
  content = content.replace(/if \(data\.success\) {/g, "if ((data as any).success) {");
  content = content.replace(/setBusinesses\(data\.data\);/g, "setBusinesses((data as any).data);");
  content = content.replace(/setBusinesses\(data\.data\.businesses\);/g, "setBusinesses((data as any).data.businesses);");
  content = content.replace(/setBusiness\(data\.data\);/g, "setBusiness((data as any).data);");
  content = content.replace(/setBusiness\(response\.data\);/g, "setBusiness((response as any).data);");
  
  fs.writeFileSync(filePath, content, 'utf8');
});

// Also fix ProfileScreen
const profilePath = path.join(screensDir, 'ProfileScreen.tsx');
if (fs.existsSync(profilePath)) {
  let content = fs.readFileSync(profilePath, 'utf8');
  content = content.replace(/user\?\.role === 'BUSINESS_OWNER'/g, "user?.role === 'BUSINESS_OWNER' as any");
  content = content.replace(/user\?\.role === 'ADMIN'/g, "user?.role === 'ADMIN' as any");
  fs.writeFileSync(profilePath, content, 'utf8');
}

console.log('Done fixing client screens.');
