import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

interface TriggerNodeProps {
  data: {
    label: string;
    config?: {
      type?: string;
    };
  };
  selected: boolean;
}

function TriggerNode({ data, selected }: TriggerNodeProps) {
  const triggerTypeLabel = {
    manual: '수동',
    webhook: 'Webhook',
    cron: '스케줄',
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg bg-card border-2 min-w-[150px] ${
        selected ? 'border-primary shadow-lg' : 'border-yellow-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-yellow-500">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-medium">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {triggerTypeLabel[data.config?.type as keyof typeof triggerTypeLabel] || '수동'}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />
    </div>
  );
}

export default memo(TriggerNode);
