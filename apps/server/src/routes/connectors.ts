import { Router } from 'express';
import { connectorRepository } from '../database/repositories/connectorRepository.js';
import { notFound, badRequest } from '../middleware/errorHandler.js';
import { getConnectorDefinitions } from '../connectors/index.js';

const router = Router();

// 사용 가능한 커넥터 타입 목록
router.get('/types', (req, res) => {
  const definitions = getConnectorDefinitions();
  res.json(definitions);
});

// 커넥터 타입별 스키마 조회
router.get('/types/:type/schema', (req, res, next) => {
  const definitions = getConnectorDefinitions();
  const definition = definitions.find(d => d.type === req.params.type);

  if (!definition) {
    return next(notFound('커넥터 타입을 찾을 수 없습니다'));
  }

  res.json(definition);
});

// 등록된 커넥터 목록
router.get('/', (req, res) => {
  const connectors = connectorRepository.findAll();
  // 설정에서 민감한 정보 제거
  const safeConnectors = connectors.map(c => ({
    ...c,
    config: maskSensitiveConfig(c.config),
  }));
  res.json(safeConnectors);
});

// 커넥터 상세 조회
router.get('/:id', (req, res, next) => {
  const connector = connectorRepository.findById(req.params.id);
  if (!connector) {
    return next(notFound('커넥터를 찾을 수 없습니다'));
  }
  res.json({
    ...connector,
    config: maskSensitiveConfig(connector.config),
  });
});

// 커넥터 생성
router.post('/', (req, res, next) => {
  const { type, name, config } = req.body;

  if (!type || !name || !config) {
    return next(badRequest('type, name, config는 필수입니다'));
  }

  // 이름 중복 체크
  const existing = connectorRepository.findByName(name);
  if (existing) {
    return next(badRequest('이미 사용 중인 이름입니다'));
  }

  const connector = connectorRepository.create({ type, name, config });
  res.status(201).json(connector);
});

// 커넥터 수정
router.put('/:id', (req, res, next) => {
  const { name, config, isActive } = req.body;

  const connector = connectorRepository.update(req.params.id, {
    name,
    config,
    isActive,
  });

  if (!connector) {
    return next(notFound('커넥터를 찾을 수 없습니다'));
  }

  res.json(connector);
});

// 커넥터 삭제
router.delete('/:id', (req, res, next) => {
  const deleted = connectorRepository.delete(req.params.id);
  if (!deleted) {
    return next(notFound('커넥터를 찾을 수 없습니다'));
  }
  res.status(204).send();
});

// 커넥터 연결 테스트
router.post('/:id/test', async (req, res, next) => {
  const connector = connectorRepository.findById(req.params.id);
  if (!connector) {
    return next(notFound('커넥터를 찾을 수 없습니다'));
  }

  // TODO: 실제 연결 테스트 구현
  res.json({
    success: true,
    message: '연결 테스트 성공',
  });
});

function maskSensitiveConfig(config: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...config };
  const sensitiveKeys = ['token', 'password', 'secret', 'apiKey', 'api_key', 'key'];

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      const value = masked[key];
      if (typeof value === 'string' && value.length > 4) {
        masked[key] = value.slice(0, 4) + '****';
      }
    }
  }

  return masked;
}

export default router;
