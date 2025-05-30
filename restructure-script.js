const fs = require('fs');
const path = require('path');

const featuresDir = '/home/runner/work/guiders-frontend/guiders-frontend/guiders/src/app/features';
const backofficeAppDir = '/home/runner/work/guiders-frontend/guiders-frontend/backoffice/src/app';
const backofficeFeatureDir = path.join(backofficeAppDir, 'features');

// Create the features folder in backoffice app
if (!fs.existsSync(backofficeFeatureDir)) {
  fs.mkdirSync(backofficeFeatureDir, { recursive: true });
}

// Get all features in guiders app
const features = fs.readdirSync(featuresDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log('Features to standardize:', features);

// Function to standardize a feature's structure
function standardizeFeature(featureName) {
  const featureDir = path.join(featuresDir, featureName);
  const componentsDir = path.join(featureDir, 'components');
  const repositoriesDir = path.join(featureDir, 'repositories');
  const servicesDir = path.join(featureDir, 'services');
  
  // Create directories if they don't exist
  for (const dir of [componentsDir, repositoriesDir, servicesDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
  
  // Check if feature component files (html/css) are directly in feature directory 
  // and component file doesn't already exist in the right place
  const mainComponentName = `${featureName}.component`;
  const htmlFile = path.join(featureDir, `${mainComponentName}.html`);
  const cssFile = path.join(featureDir, `${mainComponentName}.css`);
  const scssFile = path.join(featureDir, `${mainComponentName}.scss`);
  const tsFile = path.join(featureDir, `${mainComponentName}.ts`);
  
  // We shouldn't need to move files, since they're already in the correct position according to the target structure
  console.log(`Standardized feature: ${featureName}`);

  // Move subcomponents to components directory
  const allFiles = fs.readdirSync(featureDir);
  for (const file of allFiles) {
    const fullPath = path.join(featureDir, file);
    
    // Skip if it's not a directory or it's one of our standard directories
    if (!fs.statSync(fullPath).isDirectory() || 
        ['components', 'repositories', 'services'].includes(file)) {
      continue;
    }
    
    // Special handling for settings-placeholder, appearance-settings, etc
    if (file.endsWith('-component') || file.includes('-')) {
      // This is likely a subcomponent, move it to components
      const targetDir = path.join(componentsDir, file);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`Created subcomponent directory: ${targetDir}`);
      }
      
      // Move all files from this directory to components/subcomponent
      const subFiles = fs.readdirSync(fullPath);
      for (const subFile of subFiles) {
        const sourcePath = path.join(fullPath, subFile);
        const targetPath = path.join(targetDir, subFile);
        
        // If the file doesn't already exist in the target location, move it
        if (!fs.existsSync(targetPath)) {
          fs.renameSync(sourcePath, targetPath);
          console.log(`Moved ${sourcePath} to ${targetPath}`);
        }
      }
      
      // If the original directory is now empty, remove it
      try {
        fs.rmdirSync(fullPath);
        console.log(`Removed empty directory: ${fullPath}`);
      } catch (err) {
        console.log(`Could not remove directory ${fullPath}: ${err.message}`);
      }
    }
  }
  
  // Handle infrastructure repositories
  const infrastructureDir = path.join(featureDir, 'infrastructure');
  const infrastructureReposDir = path.join(infrastructureDir, 'repositories');
  if (fs.existsSync(infrastructureReposDir)) {
    const repoFiles = fs.readdirSync(infrastructureReposDir);
    for (const file of repoFiles) {
      const sourcePath = path.join(infrastructureReposDir, file);
      const targetPath = path.join(repositoriesDir, file);
      
      // Copy the file if it doesn't exist in the target
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${sourcePath} to ${targetPath}`);
      }
    }
  }
  
  // Handle infrastructure components (auth feature)
  const infrastructureCompDir = path.join(infrastructureDir, 'components');
  if (fs.existsSync(infrastructureCompDir)) {
    // For the auth feature, we need to move login.component.* to the root of the feature
    const compFiles = fs.readdirSync(infrastructureCompDir);
    for (const file of compFiles) {
      if (file.startsWith('login.component.')) {
        const sourcePath = path.join(infrastructureCompDir, file);
        const targetPath = path.join(featureDir, file);
        
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Copied login component ${sourcePath} to ${targetPath}`);
        }
      } else {
        // Any other component goes to the components directory
        const componentName = file.split('.')[0]; // Get component name without extension
        const targetDir = path.join(componentsDir, componentName);
        
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const sourcePath = path.join(infrastructureCompDir, file);
        const targetPath = path.join(targetDir, file);
        
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Copied component ${sourcePath} to ${targetPath}`);
        }
      }
    }
  }
}

// Apply standardization to all features
for (const feature of features) {
  standardizeFeature(feature);
}

// Update import references in app.routes.ts
const routesFilePath = path.join(featuresDir, '..', '..', 'app.routes.ts');
if (fs.existsSync(routesFilePath)) {
  let routesContent = fs.readFileSync(routesFilePath, 'utf8');
  
  // Update the path for auth/login component
  routesContent = routesContent.replace(
    /import\('\.\/features\/auth\/infrastructure\/components\/login.component'\)/g,
    "import('./features/auth/login.component')"
  );
  
  fs.writeFileSync(routesFilePath, routesContent);
  console.log('Updated import paths in app.routes.ts');
}