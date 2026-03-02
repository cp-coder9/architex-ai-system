
import crypto from 'node:crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

console.log('admin123: ', hashPassword('admin123'));
console.log('client123: ', hashPassword('client123'));
console.log('freelancer123: ', hashPassword('freelancer123'));
