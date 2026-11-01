export type CodebaseASGEdge =
  | ExtendsEdge
  | HasFieldEdge
  | HasMethodEdge
  | ImplementsEdge
  | MutatesFieldEdge
  | CallsEdge;

export type MutatingOperation = "ASSIGN";

export type ExtendsEdge = {
  type: "EXTENDS";
  parentClassFqn: string;
  childClassFqn: string;
};

export type HasFieldEdge = {
  type: "HAS_FIELD";
  ownerFqn: string;
  fieldFqn: string;
};

export type HasMethodEdge = {
  type: "HAS_METHOD";
  ownerFqn: string;
  methodFqn: string;
};

export type ImplementsEdge = {
  type: "IMPLEMENTS";
  interfaceFqn: string;
  implementingClassFqn: string;
};

export type MutatesFieldEdge = {
  type: "MUTATES_FIELD";
  methodFqn: string;
  mutatedFieldFqn: string;
  operation: MutatingOperation;
};

export type CallsEdge = {
  type: "CALLS";
  callingMethodFqn: string;
  calledMethodFqn: string;
  targetObjectFqn: string;
  insideLoop: boolean;
  insideConditional: boolean;
  isConstructorCall: boolean;
};
