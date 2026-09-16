// test-utils.js
import { 
    formatCurrency, 
    getInitials, 
    generateOrderNumber,
    truncateText,
    isValidEmail,
    isValidPhone,
    calculateDeliveryFee,
    getStatusColor 
} from './utils/helpers.js';

console.log('🧪 Testing Utilities...\n');

// Test 1: Format Currency
console.log('1️⃣ Testing formatCurrency:');
console.log(`   R65 → ${formatCurrency(65)}`);
console.log(`   R99.99 → ${formatCurrency(99.99)}`);
console.log(`   R0 → ${formatCurrency(0)}\n`);

// Test 2: Get Initials
console.log('2️⃣ Testing getInitials:');
console.log(`   "Thabo Mokoena" → ${getInitials('Thabo Mokoena')}`);
console.log(`   "Jane" → ${getInitials('Jane')}`);
console.log(`   "" → ${getInitials('')}`);
console.log(`   null → ${getInitials(null)}\n`);

// Test 3: Generate Order Number
console.log('3️⃣ Testing generateOrderNumber:');
console.log(`   Order #: ${generateOrderNumber()}`);
console.log(`   Order #: ${generateOrderNumber()}\n`);

// Test 4: Truncate Text
console.log('4️⃣ Testing truncateText:');
const longText = 'This is a very long text that should be truncated at 20 characters';
console.log(`   Original: ${longText}`);
console.log(`   Truncated: ${truncateText(longText, 20)}\n`);

// Test 5: Email Validation
console.log('5️⃣ Testing isValidEmail:');
console.log(`   "test@example.com" → ${isValidEmail('test@example.com')} ✅`);
console.log(`   "invalid-email" → ${isValidEmail('invalid-email')} ❌`);
console.log(`   "test@gmail.com" → ${isValidEmail('test@gmail.com')} ✅\n`);

// Test 6: Phone Validation
console.log('6️⃣ Testing isValidPhone:');
console.log(`   "0821234567" → ${isValidPhone('0821234567')} ✅`);
console.log(`   "0123456789" → ${isValidPhone('0123456789')} ❌`);
console.log(`   "082" → ${isValidPhone('082')} ❌\n`);

// Test 7: Delivery Fee
console.log('7️⃣ Testing calculateDeliveryFee:');
console.log(`   Order R100, 10km → R${calculateDeliveryFee(100, 10)}`);
console.log(`   Order R600, 10km → R${calculateDeliveryFee(600, 10)} (free)`);
console.log(`   Order R100, 20km → R${calculateDeliveryFee(100, 20)}\n`);

// Test 8: Status Colors
console.log('8️⃣ Testing getStatusColor:');
console.log(`   pending → ${getStatusColor('pending')}`);
console.log(`   confirmed → ${getStatusColor('confirmed')}`);
console.log(`   delivered → ${getStatusColor('delivered')}`);
console.log(`   cancelled → ${getStatusColor('cancelled')}\n`);

console.log('✅ All utility tests complete!');