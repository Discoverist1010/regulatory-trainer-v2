import { readdirSync } from 'fs';

console.log('✅ Test file is running!');
console.log('📂 Current directory:', process.cwd());
console.log('🔧 Directory contents:', readdirSync('.'));