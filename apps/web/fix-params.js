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

  // Replace standard { params } pattern
  const regex = /export default (async )?function ([a-zA-Z0-9_]+)\(\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}\)/g;
  
  content = content.replace(regex, (match, asyncStr, funcName, paramName) => {
    changed = true;
    const isAsync = asyncStr ? 'async ' : 'async '; // Force async
    return `export default ${isAsync}function ${funcName}(props: { params: Promise<{ ${paramName}: string }> }) {\n  const params = await props.params;`;
  });

  if (changed) {
    // If we forced async on a component that might use 'use client', Next.js 15 requires async Server Components, but for Client Components, async is NOT allowed (must use `use`).
    // If there is 'use client', we use `use(props.params)` instead.
    if (content.includes("'use client'") || content.includes('"use client"')) {
       // Revert async injection and use `use`
       content = content.replace(/export default async function ([a-zA-Z0-9_]+)\(props: \{ params: Promise/g, "import { use } from 'react';\nexport default function $1(props: { params: Promise");
       content = content.replace(/const params = await props.params;/g, "const params = use(props.params);");
    }
    
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
