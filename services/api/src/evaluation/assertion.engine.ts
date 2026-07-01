import { Injectable } from '@nestjs/common';
import Ajv from 'ajv'; // Requires 'npm i ajv'

export interface Assertion {
  type:
    'EXACT_MATCH' | 'CONTAINS' | 'REGEX' | 'JSON_SCHEMA' | 'FIELD_VALIDATION';
  value?: any;
  path?: string; // For FIELD_VALIDATION
}

@Injectable()
export class AssertionEngine {
  private ajv = new Ajv();

  /**
   * Evaluates a string output against a list of assertions.
   * Returns true only if ALL assertions pass.
   */
  evaluate(output: string, assertions: Assertion[]): boolean {
    if (!assertions || assertions.length === 0) return true;

    for (const assertion of assertions) {
      const passed = this.evaluateSingle(output, assertion);
      if (!passed) return false;
    }

    return true;
  }

  private evaluateSingle(output: string, assertion: Assertion): boolean {
    switch (assertion.type) {
      case 'EXACT_MATCH':
        return output === assertion.value;
      case 'CONTAINS':
        return output.includes(assertion.value);
      case 'REGEX':
        try {
          const regex = new RegExp(assertion.value);
          return regex.test(output);
        } catch {
          return false;
        }
      case 'JSON_SCHEMA':
        try {
          const parsed = JSON.parse(output);
          const validate = this.ajv.compile(assertion.value);
          return !!validate(parsed);
        } catch {
          return false;
        }
      case 'FIELD_VALIDATION':
        try {
          const parsed = JSON.parse(output);
          const fieldVal = this.getNestedProperty(parsed, assertion.path);
          return fieldVal === assertion.value;
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private getNestedProperty(obj: any, path?: string) {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}
