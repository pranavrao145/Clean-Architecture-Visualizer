import type {
  PatternInstance,
  UmlClass,
  UmlClassKind,
  UmlMember,
  UmlRelationship,
} from '../types/codebase-info-uml.js';
import type { CodebaseASGEdge } from '../types/codebaseASGEdges.js';
import type {
  ClassNode,
  CodebaseASGNode,
  EnumNode,
  FieldNode,
  InterfaceNode,
  MethodNode,
} from '../types/codebaseASGNodes.js';
import type { CodebaseASG } from './CodebaseASG.js';
import type { Pattern } from './Pattern.js';

export type PatternMatch = {
  pattern: Pattern;
  candidateAsg: CodebaseASG;
};

type ClassLikeNode = ClassNode | InterfaceNode | EnumNode;

const CLASS_KINDS: Record<ClassLikeNode['type'], UmlClassKind> = {
  CLASS: 'class',
  INTERFACE: 'interface',
  ENUM: 'enum',
};

function isClassLike(node: CodebaseASGNode): node is ClassLikeNode {
  return node.type in CLASS_KINDS;
}

function shortTypeName(type: string): string {
  return type.replace(/\b[\w$]+\.(?=[\w$])/g, '').replace(/,\s*/g, ', ');
}

function shortParameterNames(parameterFqns: string[] | string): string {
  return shortTypeName([parameterFqns].flat().join(','));
}

function javaModifiers(modifiers: string[]): string {
  return modifiers.map((modifier) => `${modifier.toLowerCase()} `).join('');
}

function umlVisibility(modifiers: string[], ownerKind: UmlClassKind): string {
  if (modifiers.includes('PUBLIC')) return '+';
  if (modifiers.includes('PROTECTED')) return '#';
  if (modifiers.includes('PRIVATE')) return '-';
  return ownerKind === 'interface' ? '+' : '~';
}

function umlTags(modifiers: string[]): string {
  return modifiers
    .filter((modifier) => modifier === 'STATIC' || modifier === 'ABSTRACT')
    .map((modifier) => ` {${modifier.toLowerCase()}}`)
    .join('');
}


export class CodebaseInfoUML {
  private readonly classes: UmlClass[];
  private readonly relationships: UmlRelationship[];
  private readonly patternInstances: PatternInstance[];

  private readonly instanceIdsByElement = new Map<string, string[]>();
  private readonly classNodes: ClassLikeNode[];
  private readonly nodesByFqn: Map<string, CodebaseASGNode>;

  constructor(codebaseAsg: CodebaseASG, patternMatches: PatternMatch[]) {
    const nodes = codebaseAsg.getNodes();
    this.classNodes = nodes.filter(isClassLike);
    this.nodesByFqn = new Map(nodes.map((node) => [node.fqn, node]));

    this.patternInstances = patternMatches.map((match, index) =>
      this.buildPatternInstance(match, index)
    );
    this.classes = this.classNodes.map((node) =>
      this.buildClass(node, codebaseAsg.getEdges())
    );
    this.relationships = this.buildRelationships(codebaseAsg.getEdges());
  }

  getClasses(): UmlClass[] {
    return this.classes;
  }

  getRelationships(): UmlRelationship[] {
    return this.relationships;
  }

  getPatternInstances(): PatternInstance[] {
    return this.patternInstances;
  }

  private buildPatternInstance(
    { pattern, candidateAsg }: PatternMatch,
    index: number
  ): PatternInstance {
    const id = `${pattern.data.id}-${index}`;
    const classFqns: string[] = [];
    const memberFqns: string[] = [];

    for (const node of candidateAsg.getNodes()) {
      (isClassLike(node) ? classFqns : memberFqns).push(node.fqn);
      this.addInstanceId(node.fqn, id);
    }
    for (const edge of candidateAsg.getEdges()) {
      const relationship = this.toRelationship(edge);
      if (relationship) this.addInstanceId(relationship.id, id);
    }

    return {
      id,
      patternId: pattern.data.id,
      patternName: pattern.data.metadata.patternName,
      patternType: pattern.data.metadata.patternType,
      description: pattern.data.metadata.description,
      learningInfo: pattern.data.metadata.learningInfo,
      classFqns,
      memberFqns,
    };
  }

  private addInstanceId(element: string, instanceId: string): void {
    const ids = this.instanceIdsByElement.get(element) ?? [];
    this.instanceIdsByElement.set(element, [...ids, instanceId]);
  }

  private instanceIdsOf(element: string): string[] {
    return this.instanceIdsByElement.get(element) ?? [];
  }

  private buildClass(node: ClassLikeNode, edges: CodebaseASGEdge[]): UmlClass {
    const kind = CLASS_KINDS[node.type];
    const modifiers = node.type === 'ENUM' ? [] : node.modifiers;

    return {
      fqn: node.fqn,
      name: node.name,
      kind,
      codeText: `${javaModifiers(modifiers)}${kind} ${node.name} {`,
      members: this.buildMembers(node, kind, edges),
      patternInstanceIds: this.instanceIdsOf(node.fqn),
    };
  }

  private buildMembers(
    owner: ClassLikeNode,
    ownerKind: UmlClassKind,
    edges: CodebaseASGEdge[]
  ): UmlMember[] {
    const members: UmlMember[] = [];

    if (owner.type === 'ENUM') {
      for (const constant of owner.constants) {
        members.push(this.buildConstant(owner.fqn, constant));
      }
    }
    for (const edge of edges) {
      const memberFqn =
        edge.type === 'HAS_FIELD' && edge.ownerFqn === owner.fqn
          ? edge.fieldFqn
          : edge.type === 'HAS_METHOD' && edge.ownerFqn === owner.fqn
            ? edge.methodFqn
            : undefined;
      const member = memberFqn ? this.nodesByFqn.get(memberFqn) : undefined;

      if (member?.type === 'FIELD') {
        members.push(this.buildField(member, ownerKind));
      } else if (member?.type === 'METHOD') {
        members.push(this.buildMethod(member, ownerKind));
      }
    }
    return members;
  }

  private buildConstant(ownerFqn: string, constant: string): UmlMember {
    const fqn = `${ownerFqn}.${constant}`;
    return {
      fqn,
      kind: 'constant',
      umlText: constant,
      codeText: `${constant},`,
      patternInstanceIds: this.instanceIdsOf(fqn),
    };
  }

  private buildField(field: FieldNode, ownerKind: UmlClassKind): UmlMember {
    const type = shortTypeName(field.typeFqn);
    const visibility = umlVisibility(field.modifiers, ownerKind);
    return {
      fqn: field.fqn,
      kind: 'field',
      umlText: `${visibility} ${field.name}: ${type}${umlTags(field.modifiers)}`,
      codeText: `${javaModifiers(field.modifiers)}${type} ${field.name};`,
      patternInstanceIds: this.instanceIdsOf(field.fqn),
    };
  }

  private buildMethod(method: MethodNode, ownerKind: UmlClassKind): UmlMember {
    const returnType = shortTypeName(method.returnTypeFqn);
    const parameters = shortParameterNames(method.parameterFqns);
    const visibility = umlVisibility(method.modifiers, ownerKind);
    const signature = `${method.name}(${parameters})`;
    return {
      fqn: method.fqn,
      kind: 'method',
      umlText: `${visibility} ${signature}: ${returnType}${umlTags(method.modifiers)}`,
      codeText: `${javaModifiers(method.modifiers)}${returnType} ${signature};`,
      patternInstanceIds: this.instanceIdsOf(method.fqn),
    };
  }

  private buildRelationships(edges: CodebaseASGEdge[]): UmlRelationship[] {
    const relationships = new Map<string, UmlRelationship>();
    for (const edge of edges) {
      const relationship = this.toRelationship(edge);
      if (relationship) relationships.set(relationship.id, relationship);
    }
    return [...relationships.values()];
  }

  private toRelationship(edge: CodebaseASGEdge): UmlRelationship | undefined {
    if (edge.type === 'EXTENDS') {
      return this.buildRelationship(
        'extends',
        edge.childClassFqn,
        edge.parentClassFqn
      );
    }
    if (edge.type === 'IMPLEMENTS') {
      return this.buildRelationship(
        'implements',
        edge.implementingClassFqn,
        edge.interfaceFqn
      );
    }
    if (edge.type === 'HAS_FIELD') {
      const field = this.nodesByFqn.get(edge.fieldFqn);
      if (field?.type === 'FIELD') {
        return this.buildRelationship(
          'association',
          edge.ownerFqn,
          field.typeFqn
        );
      }
    }
    return undefined;
  }

  private buildRelationship(
    kind: UmlRelationship['kind'],
    fromReference: string,
    toReference: string
  ): UmlRelationship | undefined {
    const fromFqn = this.resolveClassFqn(fromReference);
    const toFqn = this.resolveClassFqn(toReference);
    if (!fromFqn || !toFqn || fromFqn === toFqn) return undefined;

    const id = `${kind}:${fromFqn}->${toFqn}`;
    return {
      id,
      kind,
      fromFqn,
      toFqn,
      patternInstanceIds: this.instanceIdsOf(id),
    };
  }

  private resolveClassFqn(reference: string): string | undefined {
    const exactMatch = this.classNodes.find((node) => node.fqn === reference);
    if (exactMatch) return exactMatch.fqn;

    const nameMatches = this.classNodes.filter(
      (node) => node.name === reference
    );
    return nameMatches.length === 1 ? nameMatches[0].fqn : undefined;
  }
}
