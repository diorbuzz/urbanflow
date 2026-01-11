import { X } from 'lucide-react';
import type { Node } from '@xyflow/react';

interface NodeConfigProps {
  node: Node;
  onUpdate: (data: any) => void;
  onClose: () => void;
}

export default function NodeConfig({ node, onUpdate, onClose }: NodeConfigProps) {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ label: e.target.value });
  };

  return (
    <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">노드 설정</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* 기본 설정 */}
        <div>
          <label className="block text-sm font-medium mb-1">노드 이름</label>
          <input
            type="text"
            value={(node.data as Record<string, any>)?.label || ''}
            onChange={handleLabelChange}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">노드 타입</label>
          <input
            type="text"
            value={node.type || ''}
            disabled
            className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">노드 ID</label>
          <input
            type="text"
            value={node.id}
            disabled
            className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground text-xs"
          />
        </div>

        <hr className="border-border" />

        {/* 타입별 설정 */}
        {node.type === 'trigger' && (
          <TriggerConfig
            config={(node.data as Record<string, any>)?.config || {}}
            onUpdate={(config) => onUpdate({ config })}
          />
        )}

        {node.type === 'action' && (
          <ActionConfig
            config={(node.data as Record<string, any>)?.config || {}}
            onUpdate={(config) => onUpdate({ config })}
          />
        )}

        {node.type === 'condition' && (
          <ConditionConfig
            config={(node.data as Record<string, any>)?.config || {}}
            onUpdate={(config) => onUpdate({ config })}
          />
        )}

        {node.type === 'connector' && (
          <ConnectorConfig
            config={(node.data as Record<string, any>)?.config || {}}
            onUpdate={(config) => onUpdate({ config })}
          />
        )}
      </div>
    </div>
  );
}

function TriggerConfig({
  config,
  onUpdate,
}: {
  config: any;
  onUpdate: (config: any) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">트리거 설정</h4>

      <div>
        <label className="block text-sm font-medium mb-1">트리거 타입</label>
        <select
          value={config.type || 'manual'}
          onChange={(e) => onUpdate({ ...config, type: e.target.value })}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="manual">수동 실행</option>
          <option value="webhook">Webhook</option>
          <option value="cron">스케줄 (Cron)</option>
        </select>
      </div>

      {config.type === 'webhook' && (
        <div>
          <label className="block text-sm font-medium mb-1">Webhook 경로</label>
          <input
            type="text"
            value={config.webhookPath || ''}
            onChange={(e) => onUpdate({ ...config, webhookPath: e.target.value })}
            placeholder="/my-webhook"
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {config.type === 'cron' && (
        <div>
          <label className="block text-sm font-medium mb-1">Cron 표현식</label>
          <input
            type="text"
            value={config.cronExpression || ''}
            onChange={(e) => onUpdate({ ...config, cronExpression: e.target.value })}
            placeholder="0 9 * * *"
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1">
            예: 0 9 * * * (매일 오전 9시)
          </p>
        </div>
      )}
    </div>
  );
}

function ActionConfig({
  config,
  onUpdate,
}: {
  config: any;
  onUpdate: (config: any) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">액션 설정</h4>

      <div>
        <label className="block text-sm font-medium mb-1">설명</label>
        <textarea
          value={config.description || ''}
          onChange={(e) => onUpdate({ ...config, description: e.target.value })}
          placeholder="이 액션이 하는 일..."
          rows={3}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    </div>
  );
}

function ConditionConfig({
  config,
  onUpdate,
}: {
  config: any;
  onUpdate: (config: any) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">조건 설정</h4>

      <div>
        <label className="block text-sm font-medium mb-1">조건식</label>
        <input
          type="text"
          value={config.expression || ''}
          onChange={(e) => onUpdate({ ...config, expression: e.target.value })}
          placeholder="data.value > 10"
          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">
          JavaScript 표현식을 입력하세요
        </p>
      </div>
    </div>
  );
}

function ConnectorConfig({
  config,
  onUpdate,
}: {
  config: any;
  onUpdate: (config: any) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">커넥터 설정</h4>

      <div>
        <label className="block text-sm font-medium mb-1">커넥터 선택</label>
        <select
          value={config.connectorId || ''}
          onChange={(e) => onUpdate({ ...config, connectorId: e.target.value })}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">커넥터 선택...</option>
          {/* 실제로는 API에서 커넥터 목록을 가져와야 함 */}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">액션</label>
        <select
          value={config.action || ''}
          onChange={(e) => onUpdate({ ...config, action: e.target.value })}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">액션 선택...</option>
        </select>
      </div>
    </div>
  );
}
