import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface ConditionNodeProps {
  data: {
    label: string;
    config?: {
      expression?: string;
    };
  };
  selected: boolean;
}

function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg bg-card border-2 min-w-[150px] ${
        selected ? 'border-primary shadow-lg' : 'border-purple-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-purple-500">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-medium">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.config?.expression || '조건 미설정'}
          </div>
        </div>
      </div>

      {/* True/False 핸들 */}
      <div className="flex justify-between mt-3">
        <div className="flex flex-col items-center">
          <span className="text-xs text-green-600 mb-1">True</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 bg-green-500 border-2 border-white relative"
            style={{ left: '25%' }}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-red-600 mb-1">False</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 bg-red-500 border-2 border-white relative"
            style={{ left: '75%' }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionNode);
