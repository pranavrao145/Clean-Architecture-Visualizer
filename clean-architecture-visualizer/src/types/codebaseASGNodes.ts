export type CodebaseASGNode =
  | ClassNode
  | EnumNode
  | FieldNode
  | MethodNode
  | InterfaceNode;

enum ClassModifier {
  PUBLIC,
  PRIVATE,
  PROTECTED,
  ABSTRACT,
  FINAL,
  STATIC,
}

enum FieldModifier {
  PUBLIC,
  PRIVATE,
  PROTECTED,
  STATIC,
  FINAL,
  TRANSIENT,
  VOLATILE,
}

enum MethodModifier {
  PUBLIC,
  PRIVATE,
  PROTECTED,
  STATIC,
  FINAL,
  ABSTRACT,
}

enum InterfaceModifier {
  PUBLIC,
  PRIVATE,
  PROTECTED,
  ABSTRACT,
  STATIC,
  FINAL,
}

export type ClassNode = {
  fqn: string;
  name: string;
  packageName: string;
  list: ClassModifier[];
};

export type EnumNode = {
  fqn: string;
  name: string;
  packageName: string;
  constants: string[];
};

export type FieldNode = {
  fqn: string;
  name: string;
  typeFqn: string;
  modifiers: FieldModifier[];
};

export type MethodNode = {
  fqn: string;
  name: string;
  parameterFqns: string[];
  returnTypeFqn: string;
  modifiers: MethodModifier[];
};

export type InterfaceNode = {
  fqn: string;
  name: string;
  packageName: string;
  modifiers: InterfaceModifier[];
};
