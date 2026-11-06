export type CodebaseASGNode =
  | ClassNode
  | EnumNode
  | FieldNode
  | MethodNode
  | InterfaceNode;

export type ClassModifier =
  | "PUBLIC"
  | "PRIVATE"
  | "PROTECTED"
  | "ABSTRACT"
  | "FINAL"
  | "STATIC";

export type FieldModifier =
  | "PUBLIC"
  | "PRIVATE"
  | "PROTECTED"
  | "STATIC"
  | "FINAL"
  | "TRANSIENT"
  | "VOLATILE";

export type MethodModifier =
  | "PUBLIC"
  | "PRIVATE"
  | "PROTECTED"
  | "STATIC"
  | "FINAL"
  | "ABSTRACT";

export type InterfaceModifier =
  | "PUBLIC"
  | "PRIVATE"
  | "PROTECTED"
  | "ABSTRACT"
  | "STATIC"
  | "FINAL";

export type ClassNode = {
  type: "CLASS";
  fqn: string;
  name: string;
  packageName: string;
  modifiers: ClassModifier[];
};

export type EnumNode = {
  type: "ENUM";
  fqn: string;
  name: string;
  packageName: string;
  constants: string[];
};

export type FieldNode = {
  type: "FIELD";
  fqn: string;
  name: string;
  typeFqn: string;
  modifiers: FieldModifier[];
};

export type MethodNode = {
  type: "METHOD";
  fqn: string;
  name: string;
  parameterFqns: string[];
  returnTypeFqn: string;
  modifiers: MethodModifier[];
};

export type InterfaceNode = {
  type: "INTERFACE";
  fqn: string;
  name: string;
  packageName: string;
  modifiers: InterfaceModifier[];
};
