import { Router } from 'express';
import { workflowRepository } from '../database/repositories/workflowRepository.js';
import { executionRepository } from '../database/repositories/executionRepository.js';
import { workflowExecutor } from '../engine/index.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';
import type { WorkflowDefinition } from '@urbanflow/shared';

const router = Router();

// 워크플로우 목록 조회
router.get('/', (req, res) => {
  const workflows = workflowRepository.findAll();
  res.json(workflows);
});

// 워크플로우 상세 조회
router.get('/:id', (req, res, next) => {
  const workflow = workflowRepository.findById(req.params.id);
  if (!workflow) {
    return next(notFound('워크플로우를 찾을 수 없습니다'));
  }
  res.json(workflow);
});

// 워크플로우 생성
router.post('/', (req, res, next) => {
  const { name, description, definition, triggerType, triggerConfig } = req.body;

  if (!name) {
    return next(badRequest('이름은 필수입니다'));
  }

  const defaultDefinition: WorkflowDefinition = {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  const workflow = workflowRepository.create({
    name,
    description,
    definition: definition || defaultDefinition,
    triggerType,
    triggerConfig,
  });

  res.status(201).json(workflow);
});

// 워크플로우 수정
router.put('/:id', (req, res, next) => {
  const { name, description, definition, status, triggerType, triggerConfig } = req.body;

  const workflow = workflowRepository.update(req.params.id, {
    name,
    description,
    definition,
    status,
    triggerType,
    triggerConfig,
  });

  if (!workflow) {
    return next(notFound('워크플로우를 찾을 수 없습니다'));
  }

  res.json(workflow);
});

// 워크플로우 삭제
router.delete('/:id', (req, res, next) => {
  const deleted = workflowRepository.delete(req.params.id);
  if (!deleted) {
    return next(notFound('워크플로우를 찾을 수 없습니다'));
  }
  res.status(204).send();
});

// 워크플로우 활성화
router.post('/:id/activate', (req, res, next) => {
  const workflow = workflowRepository.update(req.params.id, { status: 'active' });
  if (!workflow) {
    return next(notFound('워크플로우를 찾을 수 없습니다'));
  }
  res.json(workflow);
});

// 워크플로우 비활성화
router.post('/:id/deactivate', (req, res, next) => {
  const workflow = workflowRepository.update(req.params.id, { status: 'inactive' });
  if (!workflow) {
    return next(notFound('워크플로우를 찾을 수 없습니다'));
  }
  res.json(workflow);
});

// 워크플로우 복제
router.post('/:id/duplicate', (req, res, next) => {
  const workflow = workflowRepository.duplicate(req.params.id);
  if (!workflow) {
    return next(notFound('워크플로우를 찾을 수 없습니다'));
  }
  res.status(201).json(workflow);
});

// 워크플로우 수동 실행
router.post('/:id/execute', async (req, res, next) => {
  try {
    const workflow = workflowRepository.findById(req.params.id);
    if (!workflow) {
      return next(notFound('워크플로우를 찾을 수 없습니다'));
    }

    // WorkflowExecutor로 실제 실행
    const result = await workflowExecutor.execute(workflow.id, {
      trigger: 'manual',
      data: req.body,
      triggeredAt: new Date().toISOString(),
    });

    res.status(202).json({
      message: '워크플로우 실행이 완료되었습니다',
      executionId: result.executionId,
      status: result.status,
      durationMs: result.durationMs,
      outputs: result.outputs,
      errors: result.errors,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
