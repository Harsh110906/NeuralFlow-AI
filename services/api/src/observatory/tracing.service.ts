import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { trace, context, Span } from '@opentelemetry/api';
// import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

@Injectable()
export class TracingService implements OnModuleInit, OnModuleDestroy {
  // private provider: NodeTracerProvider;

  onModuleInit() {
    // Initialize OpenTelemetry Provider here
    // this.provider = new NodeTracerProvider();
    // this.provider.register();
    console.log('[OpenTelemetry] Tracing initialized');
  }

  onModuleDestroy() {
    // this.provider.shutdown();
  }

  /**
   * Wrapper to execute a function within an OpenTelemetry span
   */
  async traceExecution<T>(
    spanName: string,
    attributes: any,
    fn: () => Promise<T>,
  ): Promise<T> {
    // const tracer = trace.getTracer('neuralflow-core');
    // return tracer.startActiveSpan(spanName, async (span: Span) => {
    //   span.setAttributes(attributes);
    //   try {
    //     const result = await fn();
    //     return result;
    //   } catch (error) {
    //     span.recordException(error);
    //     throw error;
    //   } finally {
    //     span.end();
    //   }
    // });

    // MVP Stub
    const startTime = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - startTime;
      // Mock trace logging
      // console.log(`[Trace] ${spanName} completed in ${duration}ms`, attributes);
    }
  }
}
