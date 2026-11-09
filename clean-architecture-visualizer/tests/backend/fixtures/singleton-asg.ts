import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import type { CodebaseASGEdge } from '../../../src/types/codebaseASGEdges.js';
import type { CodebaseASGNode } from '../../../src/types/codebaseASGNodes.js';

// A singleton `Logger` used by a `Report`, in the JavaParser CLI's real output.
const nodes = [
  {
    type: 'CLASS',
    fqn: 'app.Logger',
    name: 'Logger',
    packageName: 'app',
    modifiers: ['PUBLIC'],
  },
  {
    type: 'FIELD',
    fqn: 'app.Logger.instance',
    name: 'instance',
    typeFqn: 'app.Logger',
    modifiers: ['PRIVATE', 'STATIC'],
  },
  {
    type: 'METHOD',
    fqn: 'app.Logger.getInstance()',
    name: 'getInstance',
    returnTypeFqn: 'app.Logger',
    parameterFqns: '',
    modifiers: ['PUBLIC', 'STATIC'],
  },
  {
    type: 'METHOD',
    fqn: 'app.Logger.log(java.lang.String, int, java.util.List<java.lang.String>)',
    name: 'log',
    returnTypeFqn: 'void',
    parameterFqns: 'java.lang.String,int,java.util.List<java.lang.String>',
    modifiers: ['PUBLIC'],
  },
  {
    type: 'CLASS',
    fqn: 'app.Report',
    name: 'Report',
    packageName: 'app',
    modifiers: ['PUBLIC'],
  },
  {
    type: 'FIELD',
    fqn: 'app.Report.logger',
    name: 'logger',
    typeFqn: 'Logger',
    modifiers: ['PRIVATE'],
  },
  {
    type: 'FIELD',
    fqn: 'app.Report.lines',
    name: 'lines',
    typeFqn: 'java.util.List<java.lang.String>',
    modifiers: ['PRIVATE'],
  },
  {
    type: 'INTERFACE',
    fqn: 'app.Printable',
    name: 'Printable',
    packageName: 'app',
    modifiers: ['PUBLIC'],
  },
  {
    type: 'METHOD',
    fqn: 'app.Printable.print()',
    name: 'print',
    returnTypeFqn: 'void',
    parameterFqns: '',
    modifiers: [],
  },
  {
    type: 'ENUM',
    fqn: 'app.Level',
    name: 'Level',
    packageName: 'app',
    constants: ['LOW', 'HIGH'],
  },
] as unknown as CodebaseASGNode[];

const edges: CodebaseASGEdge[] = [
  {
    type: 'HAS_FIELD',
    ownerFqn: 'app.Logger',
    fieldFqn: 'app.Logger.instance',
  },
  {
    type: 'HAS_METHOD',
    ownerFqn: 'app.Logger',
    methodFqn: 'app.Logger.getInstance()',
  },
  {
    type: 'HAS_METHOD',
    ownerFqn: 'app.Logger',
    methodFqn:
      'app.Logger.log(java.lang.String, int, java.util.List<java.lang.String>)',
  },
  { type: 'HAS_FIELD', ownerFqn: 'app.Report', fieldFqn: 'app.Report.logger' },
  { type: 'HAS_FIELD', ownerFqn: 'app.Report', fieldFqn: 'app.Report.lines' },
  {
    type: 'HAS_METHOD',
    ownerFqn: 'app.Printable',
    methodFqn: 'app.Printable.print()',
  },
  {
    type: 'IMPLEMENTS',
    interfaceFqn: 'Printable',
    implementingClassFqn: 'app.Report',
  },
];

export const makeSingletonASG = () => new CodebaseASG(nodes, edges);
