const { execSync } = require('child_process');

const uri = 'mongodb+srv://khatabook_admin:admin%402026@cluster0.bilojvc.mongodb.net/khatabook?retryWrites=true&w=majority&appName=Cluster0';

console.log('Setting MONGO_URI to:', uri);

try {
  execSync(`vercel env add MONGO_URI production --value "${uri}" --yes --cwd backend`, {
    stdio: 'inherit',
    cwd: 'd:\\Khatabook_clone'
  });
} catch (e) {
  console.error('Failed:', e.message);
}
