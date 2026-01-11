import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

interface ActionNodeProps {
  data: {
    label: string;
    config?: Record<string, unknown>;
  };
  selected: boolean;
}

function ActionNode({ data, selected }: ActionNodeProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg bg-card border-2 min-w-[150px] ${
        selected ? 'border-primary shadow-lg' : 'border-green-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-green-500">
          <Play className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-medium">{data.label}</div>
          <div className="text-xs text-muted-foreground">액션</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
}

export default memo(ActionNode);
