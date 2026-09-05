export type NodeStatus = 'completed' | 'in-progress' | 'current' | 'locked';

export interface RoadmapNodeStats {
  completion: number;
  accuracy: number;
  timeSpent: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  status: NodeStatus;
  problems: string;
  position: 'left' | 'right';
  focus: string;
  stats: RoadmapNodeStats;
}

export interface SkillMastery {
  name: string;
  progress: number;
}
