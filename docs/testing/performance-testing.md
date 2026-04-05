# Performance Testing Guide

This guide provides instructions for manually testing the performance optimizations implemented in the Blackmind Electron application.

## Prerequisites

- Mac M1 or later with 8GB RAM
- macOS 11.0 or later
- Activity Monitor (built-in macOS app)
- Optional: [Intel Power Gadget](https://www.intel.com/content/www/us/en/developer/articles/tool/power-gadget.html) or `powermetrics` for temperature monitoring

## Test Environment Setup

1. **Close unnecessary applications** to get accurate baseline measurements
2. **Disable automatic updates** and background processes
3. **Ensure the app is built in production mode**:
   ```bash
   npm run build
   npm start
   ```

## Test 13.1: CPU Usage During Animations

### Objective
Measure CPU usage during heavy animations (Dock, glassmorphism effects) and compare with baseline.

### Steps

1. **Open Activity Monitor**:
   - Launch Activity Monitor (Applications > Utilities > Activity Monitor)
   - Click the "CPU" tab
   - Sort by "% CPU" (click the column header)
   - Find "Electron" or your app name in the process list

2. **Record Baseline CPU Usage**:
   - Launch the application
   - Let it idle for 30 seconds
   - Record the CPU % (should be < 5%)

3. **Test Dock Animation**:
   - Open the Dock panel (click the app grid icon)
   - Observe the reveal animation
   - Record peak CPU % during animation
   - Record CPU % after animation settles
   - Close and reopen the Dock 5 times
   - Calculate average CPU usage

4. **Test Glassmorphism Effects**:
   - Open multiple tabs with backdrop-filter effects
   - Scroll through content
   - Switch between tabs rapidly
   - Record CPU % during these operations

5. **Test Combined Load**:
   - Open Dock panel
   - Have multiple tabs with glassmorphism active
   - Perform rapid tab switching
   - Record peak CPU %

### Expected Results

| Scenario | Expected CPU % | Notes |
|----------|---------------|-------|
| Idle | < 5% | Baseline |
| Dock Animation | < 30% | Peak during animation |
| Dock Settled | < 5% | After animation completes |
| Glassmorphism Scrolling | < 25% | With GPU acceleration |
| Combined Load | < 40% | Multiple effects active |

### Success Criteria
- ✅ CPU usage returns to baseline after animations complete
- ✅ No sustained high CPU usage (> 50%) during normal operations
- ✅ Animations remain smooth (60 FPS) even under load

### Documentation Template

```
Test 13.1 Results - CPU Usage During Animations
Date: [DATE]
System: Mac M1, 8GB RAM, macOS [VERSION]

Baseline (Idle): [X]%
Dock Animation Peak: [X]%
Dock Animation Average: [X]%
Glassmorphism Scrolling: [X]%
Combined Load Peak: [X]%

Observations:
- [Note any stuttering, frame drops, or performance issues]
- [Compare with expected results]

Improvements vs Previous Version:
- [If applicable, note improvements]
```

---

## Test 13.2: Chip Temperature During Prolonged Use

### Objective
Verify that the application doesn't cause thermal throttling during extended use with active animations.

### Steps

1. **Install Temperature Monitoring Tool**:
   
   Option A - Using `powermetrics` (built-in, requires sudo):
   ```bash
   sudo powermetrics --samplers smc -i 5000 -n 120 > temp_log.txt
   ```
   
   Option B - Using third-party tools:
   - [iStat Menus](https://bjango.com/mac/istatmenus/) (paid)
   - [Macs Fan Control](https://crystalidea.com/macs-fan-control) (free)
   - [Intel Power Gadget](https://www.intel.com/content/www/us/en/developer/articles/tool/power-gadget.html) (free)

2. **Record Baseline Temperature**:
   - Let the Mac idle for 5 minutes
   - Record the CPU temperature (should be 35-45°C)

3. **Run 10-Minute Stress Test**:
   - Launch the application
   - Open the Dock panel
   - Create 5-10 tabs with heavy content
   - Continuously interact with the UI:
     - Open/close Dock every 30 seconds
     - Switch tabs every 10 seconds
     - Scroll through content
   - Monitor temperature every minute

4. **Record Temperature Data**:
   - Note temperature at 0, 2, 4, 6, 8, 10 minutes
   - Record peak temperature
   - Note if fan speed increases significantly

### Expected Results

| Time | Expected Temp | Notes |
|------|--------------|-------|
| Baseline | 35-45°C | Idle |
| 2 min | 45-55°C | Initial load |
| 4 min | 50-60°C | Stabilizing |
| 6 min | 50-65°C | Should plateau |
| 8 min | 50-65°C | Stable |
| 10 min | 50-65°C | No further increase |

### Success Criteria
- ✅ Temperature stabilizes below 70°C
- ✅ No thermal throttling (CPU frequency remains stable)
- ✅ Fan noise remains reasonable
- ✅ Temperature returns to baseline within 2 minutes of closing app

### Documentation Template

```
Test 13.2 Results - Chip Temperature During Prolonged Use
Date: [DATE]
System: Mac M1, 8GB RAM, macOS [VERSION]
Ambient Temperature: [X]°C

Baseline Temperature: [X]°C
Temperature at 2 min: [X]°C
Temperature at 4 min: [X]°C
Temperature at 6 min: [X]°C
Temperature at 8 min: [X]°C
Temperature at 10 min: [X]°C
Peak Temperature: [X]°C

Fan Behavior:
- Initial RPM: [X]
- Peak RPM: [X]
- Audible: [Yes/No]

Thermal Throttling: [Yes/No]
CPU Frequency: [Stable/Throttled]

Observations:
- [Note any thermal issues or concerns]
- [Compare with expected results]
```

---

## Test 13.3: Memory Usage During Prolonged Use

### Objective
Verify that memory usage stays under 1.5GB and that automatic cache cleanup works correctly during 1-hour usage.

### Automated Test Script

The application includes an automated helper for this test. To use it:

1. **Enable Performance Testing Mode**:
   Add to `electron/main.js` (temporarily for testing):
   ```javascript
   const PerformanceTestHelper = require('./modules/PerformanceTestHelper');
   const perfTest = new PerformanceTestHelper();
   
   // After app.whenReady()
   app.whenReady().then(() => {
     // ... existing code ...
     
     // Start 1-hour stress test
     perfTest.runStressTest(3600, 5000).then(report => {
       perfTest.saveReport(report, 'memory-1hour-test.json');
     });
   });
   ```

2. **Run the application** and let it run for 1 hour

### Manual Testing Steps

1. **Open Activity Monitor**:
   - Launch Activity Monitor
   - Click the "Memory" tab
   - Find your application process

2. **Record Initial Memory**:
   - Note the "Memory" column value (should be < 500 MB initially)

3. **Perform Normal Usage for 1 Hour**:
   - Open and close tabs
   - Navigate to different websites
   - Open/close the Dock panel
   - Use search functionality
   - Let the app idle for periods

4. **Monitor Memory Every 5 Minutes**:
   - Record memory usage
   - Watch for automatic cache cleanup events (check console logs)
   - Note if memory spikes above 1.5GB

5. **Check Console Logs**:
   - Look for memory cleanup messages
   - Verify cleanup occurs when memory exceeds 1.5GB
   - Confirm memory is freed after cleanup

### Expected Results

| Time | Expected Memory | Notes |
|------|----------------|-------|
| 0 min | 300-500 MB | Initial load |
| 15 min | 500-800 MB | Normal growth |
| 30 min | 700-1200 MB | Continued use |
| 45 min | 800-1400 MB | May trigger cleanup |
| 60 min | < 1500 MB | Should stay under threshold |

### Success Criteria
- ✅ Memory never exceeds 1.5GB for more than 30 seconds
- ✅ Automatic cleanup triggers when threshold is reached
- ✅ Memory is freed after cleanup (reduction of 200-500 MB)
- ✅ No memory leaks (steady growth without cleanup)
- ✅ Application remains responsive after cleanup

### Documentation Template

```
Test 13.3 Results - Memory Usage During Prolonged Use
Date: [DATE]
System: Mac M1, 8GB RAM, macOS [VERSION]

Memory Usage Timeline:
0 min: [X] MB
5 min: [X] MB
10 min: [X] MB
15 min: [X] MB
20 min: [X] MB
25 min: [X] MB
30 min: [X] MB
35 min: [X] MB
40 min: [X] MB
45 min: [X] MB
50 min: [X] MB
55 min: [X] MB
60 min: [X] MB

Peak Memory: [X] MB
Average Memory: [X] MB
Threshold Breaches: [X] times

Automatic Cleanup Events:
1. Time: [X] min, Before: [X] MB, After: [X] MB, Freed: [X] MB
2. Time: [X] min, Before: [X] MB, After: [X] MB, Freed: [X] MB
[Add more as needed]

Memory Leak Detection:
- Steady growth without cleanup: [Yes/No]
- Memory returns to baseline after cleanup: [Yes/No]

Observations:
- [Note any memory issues or concerns]
- [Verify automatic cleanup is working]
- [Compare with expected results]
```

---

## Comparison with Previous Version

If you have a previous version without optimizations, run the same tests and compare:

### Comparison Template

```
Performance Comparison Report
Date: [DATE]

Test 13.1 - CPU Usage:
                    Before      After       Improvement
Idle:               [X]%        [X]%        [X]%
Dock Animation:     [X]%        [X]%        [X]%
Glassmorphism:      [X]%        [X]%        [X]%
Combined Load:      [X]%        [X]%        [X]%

Test 13.2 - Temperature:
                    Before      After       Improvement
Peak Temp:          [X]°C       [X]°C       [X]°C
Stable Temp:        [X]°C       [X]°C       [X]°C
Throttling:         [Yes/No]    [Yes/No]    [Better/Same]

Test 13.3 - Memory:
                    Before      After       Improvement
Peak Memory:        [X] MB      [X] MB      [X] MB
Avg Memory:         [X] MB      [X] MB      [X] MB
Cleanup Events:     [X]         [X]         [More/Less]

Overall Assessment:
- CPU Usage: [Improved/Same/Worse] by [X]%
- Temperature: [Improved/Same/Worse] by [X]°C
- Memory Management: [Improved/Same/Worse]
- User Experience: [Smoother/Same/Worse]

Recommendations:
- [Any further optimizations needed]
- [Issues to address]
```

---

## Troubleshooting

### High CPU Usage
- Check if GPU acceleration is enabled (see DiagnosticsModule logs)
- Verify Metal is being used on macOS
- Check for software rasterization fallback
- Reduce backdrop-filter blur values if needed

### High Temperature
- Verify fan is working properly
- Check ambient temperature
- Ensure proper ventilation
- Consider reducing animation complexity

### Memory Issues
- Check if automatic cleanup is triggering
- Verify cleanup is freeing memory
- Look for memory leaks in console
- Check if threshold is appropriate for your use case

### Performance Degradation
- Clear all caches manually
- Restart the application
- Check for background processes
- Verify system resources are available

---

## Automated Testing Script

For convenience, you can use the included `PerformanceTestHelper` module:

```javascript
// In electron/main.js or a test script
const PerformanceTestHelper = require('./modules/PerformanceTestHelper');

// Create test instance
const perfTest = new PerformanceTestHelper();

// Run 10-minute test
perfTest.runStressTest(600, 5000).then(report => {
  perfTest.printReport(report);
  perfTest.saveReport(report, 'performance-test-10min.json');
});

// Or manual control
perfTest.startTest('Custom Test');
setInterval(() => {
  perfTest.takeSnapshot();
}, 5000);

// Later...
const report = perfTest.endTest();
perfTest.printReport(report);
```

---

## Reporting Issues

If you encounter performance issues during testing:

1. Save all test results and logs
2. Include system information (macOS version, hardware specs)
3. Note specific scenarios that cause problems
4. Provide Activity Monitor screenshots if possible
5. Include console logs from the application

---

## Next Steps

After completing all tests:

1. Document all results using the templates provided
2. Compare with expected results
3. Identify any areas needing further optimization
4. Update the README.md with performance characteristics
5. Consider adding automated performance regression tests
