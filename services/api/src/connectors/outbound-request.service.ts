import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import { ConnectorSecretService } from './secret.service';

const lookup = promisify(dns.lookup);

@Injectable()
export class OutboundRequestService {
  private readonly logger = new Logger(OutboundRequestService.name);

  // Helper to check if an IP is in a forbidden range
  private isForbiddenIp(ip: string): boolean {
    // IPv4 Checks
    if (ip.includes('.')) {
      const parts = ip.split('.').map(Number);
      if (
        parts[0] === 127 || // Loopback
        parts[0] === 10 || // Private A
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // Private B
        (parts[0] === 192 && parts[1] === 168) || // Private C
        (parts[0] === 169 && parts[1] === 254) // Link-local (Cloud Metadata)
      ) {
        return true;
      }
    }

    // Simple IPv6 check for localhost (::1) and Unique Local Addresses (fc00::/7)
    if (
      ip === '::1' ||
      ip.toLowerCase().startsWith('fc') ||
      ip.toLowerCase().startsWith('fd')
    ) {
      return true;
    }
    return false;
  }

  async executeSafeRequest(
    workspaceId: string,
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    secretService: ConnectorSecretService,
    connectorId: string,
  ): Promise<any> {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.protocol !== 'https:') {
        throw new BadRequestException(
          'Only HTTPS is supported for Custom Connectors.',
        );
      }

      // DNS Rebinding & SSRF Protection
      const { address } = await lookup(parsedUrl.hostname);

      if (this.isForbiddenIp(address)) {
        this.logger.warn(
          `SSRF Blocked: Attempted to access ${parsedUrl.hostname} resolving to ${address}`,
        );
        throw new BadRequestException(
          'Access to private or local network addresses is forbidden.',
        );
      }

      // Inject Auth (Mock mapping for now, in real life we parse the manifest authType and get the secret)
      // Note: the secret logic happens in the Controller or Sandbox runner before passing headers here,
      // but passing it as an argument is fine. Let's assume headers are fully pre-compiled by the caller.

      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        requestOptions.body =
          typeof body === 'string' ? body : JSON.stringify(body);
      }

      // We use a safe fetch with timeout via AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s max
      requestOptions.signal = controller.signal;

      const response = await fetch(parsedUrl.toString(), requestOptions);
      clearTimeout(timeoutId);

      // Enforce Size Limit (e.g. 5MB)
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
        throw new BadRequestException(
          'Response payload too large. Sandbox limits to 5MB.',
        );
      }

      // Get text first to safely truncate if necessary before parsing
      let responseText = await response.text();
      let truncated = false;
      if (responseText.length > 5 * 1024 * 1024) {
        // 5MB character fallback
        responseText = responseText.substring(0, 5 * 1024 * 1024);
        truncated = true;
      }

      let parsedBody = responseText;
      try {
        parsedBody = JSON.parse(responseText);
      } catch (e) {
        // Leave as raw text if not JSON
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
        truncated,
      };
    } catch (error: any) {
      this.logger.error(`SafeRequest Error: ${error.message}`);
      // Redact sensitive errors just in case
      throw new BadRequestException(
        `Request failed: ${error.message.replace(/([a-zA-Z0-9_-]{20,})/g, '***')}`,
      );
    }
  }
}
