import type { WorkflowNode } from '@urbanflow/shared';
import { ExecutionContext } from './ExecutionContext.js';
import { DataTransformer } from './DataTransformer.js';
import { ConnectorExecutor } from './ConnectorExecutor.js';
import { logger } from '../utils/logger.js';

export interface NodeExecutionResult {
  success: boolean;
  output: unknown;
  nextPath?: string; // 조건 분기용
  error?: string;
}

export class NodeExecutor {
  private dataTransformer: DataTransformer;
  private connectorExecutor: ConnectorExecutor;

  constructor() {
    this.dataTransformer = new DataTransformer();
    this.connectorExecutor = new ConnectorExecutor();
  }

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const nodeType = node.type;

    logger.debug({ nodeId: node.id, nodeType }, 'Executing node');

    try {
      switch (nodeType) {
        case 'trigger':
          return this.executeTrigger(node, context);

        case 'action':
          return this.executeAction(node, context);

        case 'condition':
          return this.executeCondition(node, context);

        case 'loop':
          return this.executeLoop(node, context);

        case 'delay':
          return this.executeDelay(node, context);

        case 'data-mapper':
          return this.executeDataMapper(node, context);

        case 'connector':
          return this.executeConnector(node, context);

        default:
          return {
            success: false,
            output: null,
            error: `Unknown node type: ${nodeType}`,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ nodeId: node.id, error: errorMessage }, 'Node execution failed');

      return {
        success: false,
        output: null,
        error: errorMessage,
      };
    }
  }

  // 트리거 노드 - 트리거 데이터를 그대로 전달
  private async executeTrigger(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    return {
      success: true,
      output: context.triggerData,
    };
  }

  // 액션 노드 - 간단한 데이터 처리
  private async executeAction(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const inputData = context.getInputData(node.id);
    const config = node.data.config || {};

    // 입력 매핑 적용
    let processedData = inputData;
    if (node.data.inputMapping) {
      processedData = this.dataTransformer.applyMapping(inputData, node.data.inputMapping);
    }

    // 커스텀 스크립트 실행 (있는 경우)
    if (config.script) {
      try {
        const result = this.dataTransformer.executeScript(config.script as string, processedData);
        return { success: true, output: result };
      } catch (error) {
        return {
          success: false,
          output: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return { success: true, output: processedData };
  }

  // 조건 노드 - 조건 평가 후 경로 결정
  private async executeCondition(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const inputData = context.getInputData(node.id);
    const config = node.data.config || {};
    const expression = config.expression as string;

    if (!expression) {
      return {
        success: true,
        output: inputData,
        nextPath: 'true', // 기본값
      };
    }

    try {
      const result = this.dataTransformer.evaluateCondition(expression, inputData);
      return {
        success: true,
        output: inputData,
        nextPath: result ? 'true' : 'false',
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `Condition evaluation failed: ${error}`,
      };
    }
  }

  // 반복 노드 - 배열 데이터 순회
  private async executeLoop(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const inputData = context.getInputData(node.id);
    const config = node.data.config || {};
    const arrayPath = config.arrayPath as string || 'items';

    // 배열 데이터 추출
    const arrayData = this.dataTransformer.getValueByPath(inputData, arrayPath);

    if (!Array.isArray(arrayData)) {
      return {
        success: false,
        output: null,
        error: `Expected array at path: ${arrayPath}`,
      };
    }

    // 각 항목에 대한 결과 수집
    const results: unknown[] = [];
    for (let i = 0; i < arrayData.length; i++) {
      results.push({
        index: i,
        item: arrayData[i],
        isFirst: i === 0,
        isLast: i === arrayData.length - 1,
      });
    }

    return {
      success: true,
      output: { items: results, count: arrayData.length },
    };
  }

  // 지연 노드 - 일정 시간 대기
  private async executeDelay(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const inputData = context.getInputData(node.id);
    const config = node.data.config || {};
    const delayMs = (config.delayMs as number) || 1000;

    await new Promise(resolve => setTimeout(resolve, delayMs));

    return {
      success: true,
      output: inputData,
    };
  }

  // 데이터 매퍼 노드 - 데이터 변환
  private async executeDataMapper(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const inputData = context.getInputData(node.id);
    const config = node.data.config || {};
    const mappings = config.mappings as Array<{ source: string; target: string; transform?: string }> || [];

    try {
      const result = this.dataTransformer.transform(inputData, mappings);
      return { success: true, output: result };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // 커넥터 노드 - 외부 서비스 호출
  private async executeConnector(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const inputData = context.getInputData(node.id);
    const config = node.data.config || {};

    // 입력 매핑 적용
    let processedData = inputData;
    if (node.data.inputMapping) {
      processedData = this.dataTransformer.applyMapping(inputData, node.data.inputMapping);
    }

    try {
      const result = await this.connectorExecutor.execute(
        config.connectorId as string,
        config.action as string,
        processedData
      );

      // 출력 매핑 적용
      let outputData = result;
      if (node.data.outputMapping) {
        outputData = this.dataTransformer.applyMapping(result, node.data.outputMapping);
      }

      return { success: true, output: outputData };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
