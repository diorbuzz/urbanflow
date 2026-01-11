import { Router } from 'express';
import { executionRepository } from '../database/repositories/executionRepository.js';
import { notFound } from '../middleware/errorHandler.js';

const router = Router();

// 실행 이력 목록 조회
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  const executions = executionRepository.findAll(limit, offset);
  res.json(executions);
});

// 실행 상세 조회
router.get('/:id', (req, res, next) => {
  const execution = executionRepository.findById(req.params.id);
  if (!execution) {
    return next(notFound('실행 기록을 찾을 수 없습니다'));
  }
  res.json(execution);
});

// 실행 로그 조회
router.get('/:id/logs', (req, res, next) => {
  const execution = executionRepository.findById(req.params.id);
  if (!execution) {
    return next(notFound('실행 기록을 찾을 수 없습니다'));
  }

  const logs = executionRepository.getNodeLogs(req.params.id);
  res.json(logs);
});

// 실행 취소
router.post('/:id/cancel', (req, res, next) => {
  const execution = executionRepository.findById(req.params.id);
  if (!execution) {
    return next(notFound('실행 기록을 찾을 수 없습니다'));
  }

  if (execution.status !== 'running' && execution.status !== 'pending') {
    return res.status(400).json({ error: '진행 중인 실행만 취소할 수 있습니다' });
  }

  executionRepository.updateStatus(req.params.id, 'cancelled');
  res.json({ message: '실행이 취소되었습니다' });
});

// 실행 삭제
router.delete('/:id', (req, res, next) => {
  const deleted = executionRepository.delete(req.params.id);
  if (!deleted) {
    return next(notFound('실행 기록을 찾을 수 없습니다'));
  }
  res.status(204).send();
});

export default router;
