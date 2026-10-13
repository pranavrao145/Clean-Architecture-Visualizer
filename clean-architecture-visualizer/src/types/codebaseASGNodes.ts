export type codebaseASGNode = classNode | enumNode | fieldNode | methodNode | interfaceNode;

enum classModifier {
  PUBLIC,
  PRIVATE,
  PROTECTED,
  ABSTRACT,
  FINAL,
  STATIC,
}

enum fieldModifier {
  PUBLIC,
  PRIVATE,
  PROTECTED,
  STATIC,
  FINAL,
  TRANSIENT,
  VOLATILE,
}

enum methodModifier {
  PUBLIC,
  PRIVATE,
  PROTECTED,
  STATIC,
  FINAL,
  ABSTRACT,
}

enum interfaceModifier {
  PUBLIC,
  PRIVATE,
  PROTECTED,
  ABSTRACT,
  STATIC,
  FINAL,
}

export type classNode = {
  fqn: string;
  name: string;
  packageName: string;
  list: classModifier[];
};

export type enumNode = {
  fqn: string;
  name: string;
  packageName: string;
  constants: string[];
};

export type fieldNode = {
  fqn: string;
  name: string;
  typeFqn: string;
  modifiers: fieldModifier[];
};

export type methodNode = {
  fqn: string;
  name: string;
  parameterFqns: string[];
  returnTypeFqn: string;
  modifiers: methodModifier[];
};

export type interfaceNode = {
  fqn: string;
  name: string;
  packageName: string;
  modifiers: interfaceModifier[];
};
