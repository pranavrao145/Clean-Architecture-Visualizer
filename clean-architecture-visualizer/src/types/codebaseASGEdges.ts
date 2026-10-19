export type CodebaseASGEdge =
  | ExtendsEdge
  | HasFieldEdge
  | HasMethodEdge
  | ImplementsEdge
  | MutatesFieldEdge
  | CallsEdge;

enum mutatingOperation {
  ASSIGN,
}

export type ExtendsEdge = {
  parentClassFqn: string;
  childClassFqn: string;
};

export type HasFieldEdge = { ownerFqn: string; fieldFqn: string };

export type HasMethodEdge = { ownerFqn: string; methodFqn: string };

export type ImplementsEdge = {
  interfaceFqn: string;
  implementingClassFqn: string;
};

export type MutatesFieldEdge = {
  methodFqn: string;
  mutatedFieldFqn: string;
  operation: mutatingOperation;
};

export type CallsEdge = {
  callingMethodFqn: string;
  calledMethodFqn: string;
  targetObjectFqn: string;
  insideLoop: boolean;
  insideConditional: boolean;
  isConstructorCall: boolean;
};
