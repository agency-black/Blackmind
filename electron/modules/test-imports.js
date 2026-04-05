/**
 * Test script to verify all modules can be imported without errors
 * This is a simple import verification for the checkpoint task
 */

console.log('Testing module imports...\n');

try {
  // Test ErrorLogger
  console.log('1. Testing ErrorLogger...');
  const { ErrorLogger, ErrorCode, MemoryConstants } = require('./ErrorLogger');
  console.log('   ✓ ErrorLogger imported successfully');
  console.log('   ✓ ErrorCode enum available:', Object.keys(ErrorCode).length, 'codes');
  console.log('   ✓ MemoryConstants available');

  // Test FlagsInitializer
  console.log('\n2. Testing FlagsInitializer...');
  const FlagsInitializer = require('./FlagsInitializer');
  console.log('   ✓ FlagsInitializer imported successfully');
  console.log('   ✓ Methods available:', Object.getOwnPropertyNames(FlagsInitializer).filter(m => typeof FlagsInitializer[m] === 'function').length);

  // Test WindowConfigurator
  console.log('\n3. Testing WindowConfigurator...');
  const WindowConfigurator = require('./WindowConfigurator');
  console.log('   ✓ WindowConfigurator imported successfully');
  console.log('   ✓ Methods available:', Object.getOwnPropertyNames(WindowConfigurator).filter(m => typeof WindowConfigurator[m] === 'function').length);

  // Test MemoryMonitor
  console.log('\n4. Testing MemoryMonitor...');
  const MemoryMonitor = require('./MemoryMonitor');
  console.log('   ✓ MemoryMonitor imported successfully');
  console.log('   ✓ Can instantiate:', new MemoryMonitor() instanceof MemoryMonitor);

  // Test CacheCleaner
  console.log('\n5. Testing CacheCleaner...');
  const CacheCleaner = require('./CacheCleaner');
  console.log('   ✓ CacheCleaner imported successfully');
  console.log('   ✓ Methods available:', Object.getOwnPropertyNames(CacheCleaner).filter(m => typeof CacheCleaner[m] === 'function').length);

  console.log('\n✅ All modules imported successfully!');
  console.log('\nModule verification complete. All base modules are ready for integration.');
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Import test failed:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
