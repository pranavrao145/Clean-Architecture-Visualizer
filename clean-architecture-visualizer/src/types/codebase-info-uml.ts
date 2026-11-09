// Plain data describing a UML class diagram of the analysed codebase.

export type UmlClassKind = 'class' | 'interface' | 'enum';

export type UmlMemberKind = 'field' | 'method' | 'constant';

export type UmlRelationshipKind = 'extends' | 'implements' | 'association';

export type UmlMember = {
  fqn: string;
  kind: UmlMemberKind;
  umlText: string;
  codeText: string;
  patternInstanceIds: string[];
};

export type UmlClass = {
  fqn: string;
  name: string;
  kind: UmlClassKind;
  codeText: string;
  members: UmlMember[];
  patternInstanceIds: string[];
};

export type UmlRelationship = {
  id: string;
  kind: UmlRelationshipKind;
  fromFqn: string;
  toFqn: string;
  patternInstanceIds: string[];
};

export type PatternInstance = {
  id: string;
  patternId: string;
  patternName: string;
  patternType: string;
  description: string;
  learningInfo: string;
  classFqns: string[];
  memberFqns: string[];
};
