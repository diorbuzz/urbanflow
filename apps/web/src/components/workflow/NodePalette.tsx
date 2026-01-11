import {
  Zap,
  GitBranch,
  Repeat,
  Clock,
  ArrowRightLeft,
  MessageSquare,
  Database,
  Globe,
} from 'lucide-react';

const nodeCategories = [
  {
    name: '트리거',
    nodes: [
      { type: 'trigger', label: '트리거', icon: Zap, color: 'bg-yellow-500' },
    ],
  },
  {
    name: '로직',
    nodes: [
      { type: 'condition', label: '조건', icon: GitBranch, color: 'bg-purple-500' },
      { type: 'loop', label: '반복', icon: Repeat, color: 'bg-blue-500' },
      { type: 'delay', label: '지연', icon: Clock, color: 'bg-orange-500' },
      { type: 'data-mapper', label: '데이터 변환', icon: ArrowRightLeft, color: 'bg-green-500' },
    ],
  },
  {
    name: '커넥터',
    nodes: [
      { type: 'connector', label: '메신저', icon: MessageSquare, color: 'bg-pink-500', subtype: 'messenger' },
      { type: 'connector', label: '데이터베이스', icon: Database, color: 'bg-cyan-500', subtype: 'database' },
      { type: 'connector', label: 'API', icon: Globe, color: 'bg-indigo-500', subtype: 'api' },
    ],
  },
];

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-card border-r border-border p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        노드 팔레트
      </h3>

      {nodeCategories.map((category) => (
        <div key={category.name} className="mb-6">
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
            {category.name}
          </h4>
          <div className="space-y-2">
            {category.nodes.map((node) => (
              <div
                key={`${node.type}-${node.label}`}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-grab hover:border-primary hover:shadow-sm transition-all active:cursor-grabbing"
              >
                <div className={`p-2 rounded-lg ${node.color}`}>
                  <node.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 p-3 bg-accent rounded-lg">
        <p className="text-xs text-muted-foreground">
          노드를 드래그하여 캔버스에 놓으세요
        </p>
      </div>
    </div>
  );
}
