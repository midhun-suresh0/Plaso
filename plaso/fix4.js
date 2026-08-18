const fs = require('fs');
const path = require('path');

// Fix PlasoButton style type
const btnPath = path.join(__dirname, 'client/src/components/PlasoButton.tsx');
if (fs.existsSync(btnPath)) {
  let btnContent = fs.readFileSync(btnPath, 'utf8');
  btnContent = btnContent.replace(/style\?: ViewStyle;/g, "style?: import('react-native').StyleProp<import('react-native').ViewStyle>;");
  fs.writeFileSync(btnPath, btnContent, 'utf8');
}

// Fix AppStackParamList
const typesPath = path.join(__dirname, 'client/src/types/index.ts');
if (fs.existsSync(typesPath)) {
  let typesContent = fs.readFileSync(typesPath, 'utf8');
  typesContent = typesContent.replace(/CreatePost: undefined;/g, "CreatePost: { asBusiness?: boolean } | undefined;");
  fs.writeFileSync(typesPath, typesContent, 'utf8');
}

// Fix AdminBusinessDetailsScreen
const adminPath = path.join(__dirname, 'client/src/screens/AdminBusinessDetailsScreen.tsx');
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');
  content = content.replace(/const response = await businessApi/g, "const response: any = await businessApi");
  fs.writeFileSync(adminPath, content, 'utf8');
}

// Fix BusinessDashboardScreen
const dashboardPath = path.join(__dirname, 'client/src/screens/BusinessDashboardScreen.tsx');
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  content = content.replace(/size="small"/g, "");
  content = content.replace(/if \(data\.success && data\.data\) \{/g, "if ((data as any).success && (data as any).data) {");
  fs.writeFileSync(dashboardPath, content, 'utf8');
}

// Fix BusinessProfileScreen
const profileScreenPath = path.join(__dirname, 'client/src/screens/BusinessProfileScreen.tsx');
if (fs.existsSync(profileScreenPath)) {
  let content = fs.readFileSync(profileScreenPath, 'utf8');
  content = content.replace(/size="small"/g, "");
  content = content.replace(/variant=\{isFollowing \? 'outline' : 'primary'\}/g, "variant={isFollowing ? 'secondary' : 'primary'}");
  fs.writeFileSync(profileScreenPath, content, 'utf8');
}

console.log('Fixed final TS errors');
