// test-validations.js
import { validateProduct, validateProductUpdate } from './validations/productValidation.js';

console.log('🧪 Testing Validations...\n');

// Test 1: Valid product
console.log('1️⃣ Testing valid product:');
const validProduct = {
    name: 'Sourdough Bread',
    price: 65.00,
    category: 'Bakery',
    stock: 10,
    description: 'Fresh sourdough'
};
const result1 = validateProduct(validProduct);
console.log(`   ✅ Valid: ${result1.isValid}`);
console.log(`   Errors: ${result1.errors.length}\n`);

// Test 2: Invalid product (missing name)
console.log('2️⃣ Testing invalid product (missing name):');
const invalidProduct = {
    price: 65.00,
    category: 'Bakery'
};
const result2 = validateProduct(invalidProduct);
console.log(`   ✅ Valid: ${result2.isValid}`);
console.log(`   Errors: ${result2.errors.length}`);
result2.errors.forEach(e => console.log(`   ❌ ${e}`));
console.log();

// Test 3: Invalid product (negative price)
console.log('3️⃣ Testing invalid product (negative price):');
const invalidPrice = {
    name: 'Test',
    price: -10,
    category: 'Bakery'
};
const result3 = validateProduct(invalidPrice);
console.log(`   ✅ Valid: ${result3.isValid}`);
console.log(`   Errors: ${result3.errors.length}`);
result3.errors.forEach(e => console.log(`   ❌ ${e}`));
console.log();

// Test 4: Product update validation
console.log('4️⃣ Testing product update:');
const updateData = {
    name: 'Updated Name',
    price: 99.99,
    status: 'published'
};
const result4 = validateProductUpdate(updateData);
console.log(`   ✅ Valid: ${result4.isValid}`);
console.log(`   Errors: ${result4.errors.length}\n`);

// Test 5: Invalid update (negative price)
console.log('5️⃣ Testing invalid update:');
const invalidUpdate = {
    price: -5,
    status: 'invalid_status'
};
const result5 = validateProductUpdate(invalidUpdate);
console.log(`   ✅ Valid: ${result5.isValid}`);
console.log(`   Errors: ${result5.errors.length}`);
result5.errors.forEach(e => console.log(`   ❌ ${e}`));