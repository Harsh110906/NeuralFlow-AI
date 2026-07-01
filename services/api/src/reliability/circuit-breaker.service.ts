import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

export enum CircuitBreakerState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

interface CircuitBreakerOptions {
  failureThreshold: number; // e.g. 5 failures
  resetTimeoutMs: number; // e.g. 30000 (30 seconds)
}

interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failures: number;
  lastFailureTime?: number;
  nextAttempt?: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private breakers = new Map<string, CircuitBreakerStatus>();

  private defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
  };

  /**
   * Execute a function wrapped in a circuit breaker.
   */
  async execute<T>(
    serviceName: string,
    action: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    this.ensureBreaker(serviceName);
    const status = this.breakers.get(serviceName)!;

    if (status.state === CircuitBreakerState.OPEN) {
      if (Date.now() > status.nextAttempt!) {
        this.logger.log(
          `Circuit breaker for ${serviceName} is HALF_OPEN (Testing recovery)`,
        );
        status.state = CircuitBreakerState.HALF_OPEN;
      } else {
        throw new HttpException(
          `Service ${serviceName} is temporarily unavailable (Circuit Breaker OPEN)`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    try {
      const result = await action();
      this.onSuccess(serviceName, status);
      return result;
    } catch (error) {
      this.onFailure(serviceName, status, opts);
      throw error;
    }
  }

  private ensureBreaker(serviceName: string) {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, {
        state: CircuitBreakerState.CLOSED,
        failures: 0,
      });
    }
  }

  private onSuccess(serviceName: string, status: CircuitBreakerStatus) {
    if (status.state !== CircuitBreakerState.CLOSED) {
      this.logger.log(
        `Circuit breaker for ${serviceName} is now CLOSED (Recovered)`,
      );
    }
    status.failures = 0;
    status.state = CircuitBreakerState.CLOSED;
    status.lastFailureTime = undefined;
    status.nextAttempt = undefined;
  }

  private onFailure(
    serviceName: string,
    status: CircuitBreakerStatus,
    options: CircuitBreakerOptions,
  ) {
    status.failures += 1;
    status.lastFailureTime = Date.now();

    if (
      status.state === CircuitBreakerState.HALF_OPEN ||
      status.failures >= options.failureThreshold
    ) {
      status.state = CircuitBreakerState.OPEN;
      // Exponential backoff logic could be added here, currently using static resetTimeout
      status.nextAttempt = Date.now() + options.resetTimeoutMs;
      this.logger.error(
        `Circuit breaker for ${serviceName} is now OPEN. Next attempt in ${options.resetTimeoutMs}ms`,
      );
    }
  }

  getBreakerStatus(serviceName: string): CircuitBreakerStatus | undefined {
    return this.breakers.get(serviceName);
  }
}
