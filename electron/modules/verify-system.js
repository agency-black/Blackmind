/**
 * Sistema de Verificación Final
 * 
 * Este script verifica que todos los módulos están correctamente implementados
 * y funcionan según lo esperado.
 */

const FlagsInitializer = require('./FlagsInitializer');
const WindowConfigurator = require('./WindowConfigurator');
const MemoryMonitor = require('./MemoryMonitor');
const CacheCleaner = require('./CacheCleaner');
const DiagnosticsModule = require('./DiagnosticsModule');
const { ErrorLogger } = require('./ErrorLogger');

console.log('\n========================================');
console.log('  VERIFICACIÓN DEL SISTEMA COMPLETO');
console.log('========================================\n');

let allTestsPassed = true;

// Test 1: Verificar que FlagsInitializer tiene todos los métodos
console.log('✓ Test 1: FlagsInitializer');
if (typeof FlagsInitializer.initializePerformanceFlags === 'function' &&
    typeof FlagsInitializer.initializeMacOSFlags === 'function' &&
    typeof FlagsInitializer.initializeMemoryLimits === 'function' &&
    typeof FlagsInitializer.logActiveFlags === 'function') {
  console.log('  ✓ Todos los métodos presentes\n');
} else {
  console.log('  ✗ Faltan métodos\n');
  allTestsPassed = false;
}

// Test 2: Verificar que WindowConfigurator tiene todos los métodos
console.log('✓ Test 2: WindowConfigurator');
if (typeof WindowConfigurator.createBaseConfig === 'function' &&
    typeof WindowConfigurator.applyMacOSConfig === 'function' &&
    typeof WindowConfigurator.configureWebPreferences === 'function') {
  console.log('  ✓ Todos los métodos presentes\n');
} else {
  console.log('  ✗ Faltan métodos\n');
  allTestsPassed = false;
}

// Test 3: Verificar que MemoryMonitor se puede instanciar
console.log('✓ Test 3: MemoryMonitor');
try {
  const monitor = new MemoryMonitor();
  if (typeof monitor.start === 'function' &&
      typeof monitor.stop === 'function' &&
      typeof monitor.getCurrentMemoryUsage === 'function' &&
      typeof monitor.isMemoryExcessive === 'function') {
    console.log('  ✓ Instanciación exitosa y métodos presentes\n');
  } else {
    console.log('  ✗ Faltan métodos\n');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('  ✗ Error al instanciar:', error.message, '\n');
  allTestsPassed = false;
}

// Test 4: Verificar que CacheCleaner tiene todos los métodos
console.log('✓ Test 4: CacheCleaner');
if (typeof CacheCleaner.clearAppCache === 'function' &&
    typeof CacheCleaner.clearWindowCaches === 'function' &&
    typeof CacheCleaner.clearStorageData === 'function' &&
    typeof CacheCleaner.logMemoryFreed === 'function') {
  console.log('  ✓ Todos los métodos presentes\n');
} else {
  console.log('  ✗ Faltan métodos\n');
  allTestsPassed = false;
}

// Test 5: Verificar que DiagnosticsModule tiene todos los métodos
console.log('✓ Test 5: DiagnosticsModule');
if (typeof DiagnosticsModule.getGPUInfo === 'function' &&
    typeof DiagnosticsModule.getGPUFeatureStatus === 'function' &&
    typeof DiagnosticsModule.generateDiagnosticReport === 'function' &&
    typeof DiagnosticsModule.logDiagnostics === 'function') {
  console.log('  ✓ Todos los métodos presentes\n');
} else {
  console.log('  ✗ Faltan métodos\n');
  allTestsPassed = false;
}

// Test 6: Verificar que ErrorLogger funciona
console.log('✓ Test 6: ErrorLogger');
try {
  ErrorLogger.logInfo('Test de logging');
  console.log('  ✓ Logging funciona correctamente\n');
} catch (error) {
  console.log('  ✗ Error en logging:', error.message, '\n');
  allTestsPassed = false;
}

// Test 7: Verificar configuración de WindowConfigurator
console.log('✓ Test 7: Configuración de Ventana');
try {
  const config = WindowConfigurator.createBaseConfig();
  const webPrefs = config.webPreferences;
  
  if (webPrefs.offscreen === false &&
      webPrefs.nodeIntegrationInWorker === true &&
      webPrefs.sandbox === false &&
      webPrefs.enableWebSQL === false &&
      webPrefs.contextIsolation === true &&
      webPrefs.backgroundThrottling === false &&
      webPrefs.hardwareAcceleration === true) {
    console.log('  ✓ Configuración correcta de webPreferences\n');
  } else {
    console.log('  ✗ Configuración incorrecta de webPreferences\n');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('  ✗ Error al crear configuración:', error.message, '\n');
  allTestsPassed = false;
}

// Test 8: Verificar umbrales de memoria
console.log('✓ Test 8: Umbrales de Memoria');
const monitor = new MemoryMonitor();
const memoryUsage = monitor.getCurrentMemoryUsage();
console.log(`  Uso actual de memoria: ${memoryUsage.heapUsed}MB heap, ${memoryUsage.rss}MB RSS`);
if (memoryUsage.heapUsed < 1536) {
  console.log('  ✓ Memoria bajo el umbral (1536MB)\n');
} else {
  console.log('  ⚠ Memoria por encima del umbral\n');
}

// Resumen final
console.log('========================================');
if (allTestsPassed) {
  console.log('  ✅ TODOS LOS TESTS PASARON');
  console.log('  Sistema completo verificado exitosamente');
} else {
  console.log('  ❌ ALGUNOS TESTS FALLARON');
  console.log('  Revisar los errores arriba');
}
console.log('========================================\n');

process.exit(allTestsPassed ? 0 : 1);
