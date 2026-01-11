import type { DataMapping } from '@urbanflow/shared';

export class DataTransformer {
  // 데이터 매핑 적용
  applyMapping(data: unknown, mappings: DataMapping[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const mapping of mappings) {
      const value = this.getValueByPath(data, mapping.sourceField);
      let transformedValue = value;

      // 변환 함수 적용
      if (mapping.transform) {
        transformedValue = this.applyTransform(value, mapping.transform);
      }

      this.setValueByPath(result, mapping.targetField, transformedValue);
    }

    return result;
  }

  // 데이터 변환
  transform(
    data: unknown,
    mappings: Array<{ source: string; target: string; transform?: string }>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const mapping of mappings) {
      const value = this.getValueByPath(data, mapping.source);
      let transformedValue = value;

      if (mapping.transform) {
        transformedValue = this.applyTransform(value, mapping.transform);
      }

      this.setValueByPath(result, mapping.target, transformedValue);
    }

    return result;
  }

  // 조건 평가
  evaluateCondition(expression: string, data: unknown): boolean {
    try {
      // 안전한 조건 평가 (Function 생성자 사용)
      const func = new Function('data', `with(data) { return ${expression}; }`);
      return Boolean(func(data));
    } catch (error) {
      throw new Error(`Failed to evaluate condition: ${expression}`);
    }
  }

  // 스크립트 실행
  executeScript(script: string, data: unknown): unknown {
    try {
      const func = new Function('data', `with(data) { ${script} }`);
      return func(data);
    } catch (error) {
      throw new Error(`Failed to execute script: ${error}`);
    }
  }

  // 경로로 값 가져오기 (예: "user.name" -> data.user.name)
  getValueByPath(data: unknown, path: string): unknown {
    if (!path) return data;

    const parts = path.split('.');
    let current: unknown = data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // 배열 인덱스 처리 (예: "items[0]")
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = (current as Record<string, unknown>)[key];
        if (Array.isArray(current)) {
          current = current[parseInt(index, 10)];
        } else {
          return undefined;
        }
      } else {
        current = (current as Record<string, unknown>)[part];
      }
    }

    return current;
  }

  // 경로로 값 설정하기
  setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  // 변환 함수 적용
  private applyTransform(value: unknown, transform: string): unknown {
    switch (transform) {
      case 'toString':
        return String(value);

      case 'toNumber':
        return Number(value);

      case 'toBoolean':
        return Boolean(value);

      case 'toUpperCase':
        return typeof value === 'string' ? value.toUpperCase() : value;

      case 'toLowerCase':
        return typeof value === 'string' ? value.toLowerCase() : value;

      case 'trim':
        return typeof value === 'string' ? value.trim() : value;

      case 'toJSON':
        return JSON.stringify(value);

      case 'fromJSON':
        return typeof value === 'string' ? JSON.parse(value) : value;

      case 'toArray':
        return Array.isArray(value) ? value : [value];

      case 'first':
        return Array.isArray(value) ? value[0] : value;

      case 'last':
        return Array.isArray(value) ? value[value.length - 1] : value;

      case 'length':
        if (typeof value === 'string' || Array.isArray(value)) {
          return value.length;
        }
        return 0;

      case 'keys':
        return typeof value === 'object' && value !== null ? Object.keys(value) : [];

      case 'values':
        return typeof value === 'object' && value !== null ? Object.values(value) : [];

      default:
        // 커스텀 변환 표현식 실행
        if (transform.startsWith('expr:')) {
          const expression = transform.slice(5);
          try {
            const func = new Function('value', `return ${expression}`);
            return func(value);
          } catch {
            return value;
          }
        }
        return value;
    }
  }

  // 템플릿 문자열 처리 (예: "Hello, {{name}}!")
  interpolate(template: string, data: unknown): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(data, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }
}
