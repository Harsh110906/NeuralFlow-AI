const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('page.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src', 'app'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('const params = await props.params; {')) {
    content = content.replace(/const params = await props\.params; \{/g, 'const params = await props.params;');
    changed = true;
  }
  if (content.includes('const params = use(props.params); {')) {
    content = content.replace(/const params = use\(props\.params\); \{/g, 'const params = use(props.params);');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed syntax error in', file);
  }
}
