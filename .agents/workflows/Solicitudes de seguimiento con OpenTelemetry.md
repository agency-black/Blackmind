Solicitudes de seguimiento con OpenTelemetry

---
description: Setup request tracing
---

1. **Install OpenTelemetry**:
   // turbo
   - Run `npm install @opentelemetry/api`

2. **Add Trace IDs**:
   ```ts
   import { trace } from '@opentelemetry/api';
   const traceId = trace.getActiveSpan()?.spanContext().traceId;
   ```

3. **Visualize with Jaeger**:
   // turbo
   - Run `docker run -d -p 16686:16686 jaegertracing/all-in-one`

4. **Pro Tips**:
   - Use Datadog for production.

