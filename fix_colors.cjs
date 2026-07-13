const fs = require('fs');
const files = [
  'src/pages/Product/Product.jsx',
  'src/pages/Outlet/Outlet.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/color:\s*['"]#(0f172a|1e293b|334155)['"]/g, 'color: "text.primary"');
  content = content.replace(/color:\s*['"]#(64748b|475569|94a3b8)['"]/g, 'color: "text.secondary"');
  
  content = content.replace(/bgcolor:\s*['"]#f8fafc['"]/g, 'bgcolor: "background.default"');
  content = content.replace(/bgcolor:\s*['"]#f1f5f9['"]/g, 'bgcolor: "background.default"');
  content = content.replace(/bgcolor:\s*['"]#ffffff['"]/g, 'bgcolor: "background.paper"');
  content = content.replace(/bgcolor:\s*['"]#fff['"]/g, 'bgcolor: "background.paper"');
  
  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
});
