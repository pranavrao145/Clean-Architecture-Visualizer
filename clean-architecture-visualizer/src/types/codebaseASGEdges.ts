export type codebaseASGEdge =
  | extendsEdge
  | hasFieldEdge
  | hasMethodEdge
  | implementsEdge
  | mutatesFieldEdge
  | callsEdge;

enum mutatingOperation {
  ASSIGN,
}

export type extendsEdge = {
  parentClassFqn: string;
  childClassFqn: string;
};

export type hasFieldEdge = { ownerFqn: string; fieldFqn: string };

export type hasMethodEdge = { ownerFqn: string; methodFqn: string };

export type implementsEdge = {
  interfaceFqn: string;
  implementingClassFqn: string;
};

export type mutatesFieldEdge = {
  methodFqn: string;
  mutatedFieldFqn: string;
  operation: mutatingOperation;
};

export type callsEdge = {
  callingMethodFqn: string;
  calledMethodFqn: string;
  targetObjectFqn: string;
  insideLoop: boolean;
  insideConditional: boolean;
  isConstructorCall: boolean;
};
