import { CodebaseASG } from '../../../src/entity/CodebaseASG.js';
import type { CodebaseASGEdge } from '../../../src/types/codebaseASGEdges.js';
import type { CodebaseASGNode } from '../../../src/types/codebaseASGNodes.js';

// In the JavaParser CLI's real output, a `Payment` whose `pay` picks one of
// four `Card` calls with an if/else-if chain, and whose `ship` has a short
// three-case switch plus one call outside it.
const nodes = [
  {
    type: 'CLASS',
    fqn: 'app.Payment',
    name: 'Payment',
    packageName: 'app',
    modifiers: ['PUBLIC'],
  },
  {
    type: 'FIELD',
    fqn: 'app.Payment.card',
    name: 'card',
    typeFqn: 'app.Card',
    modifiers: ['PRIVATE'],
  },
  {
    type: 'METHOD',
    fqn: 'app.Payment.pay(java.lang.String, int)',
    name: 'pay',
    returnTypeFqn: 'void',
    parameterFqns: 'java.lang.String,int',
    modifiers: ['PUBLIC'],
  },
  {
    type: 'METHOD',
    fqn: 'app.Payment.ship(int)',
    name: 'ship',
    returnTypeFqn: 'void',
    parameterFqns: 'int',
    modifiers: ['PUBLIC'],
  },
  {
    type: 'CLASS',
    fqn: 'app.Card',
    name: 'Card',
    packageName: 'app',
    modifiers: [],
  },
] as unknown as CodebaseASGNode[];

const PAY = 'app.Payment.pay(java.lang.String, int)';
const SHIP = 'app.Payment.ship(int)';

const call = (
  callingMethodFqn: string,
  calledMethodFqn: string,
  insideConditional = true
): CodebaseASGEdge => ({
  type: 'CALLS',
  callingMethodFqn,
  calledMethodFqn,
  targetObjectFqn: calledMethodFqn.startsWith('java.lang.String')
    ? 'java.lang.String'
    : 'app.Card',
  insideLoop: false,
  insideConditional,
  isConstructorCall: false,
});

const edges: CodebaseASGEdge[] = [
  { type: 'HAS_FIELD', ownerFqn: 'app.Payment', fieldFqn: 'app.Payment.card' },
  { type: 'HAS_METHOD', ownerFqn: 'app.Payment', methodFqn: PAY },
  { type: 'HAS_METHOD', ownerFqn: 'app.Payment', methodFqn: SHIP },
  // Each `kind.equals(...)` check is reported as a conditional call too.
  call(PAY, 'java.lang.String.equals(java.lang.Object)'),
  call(PAY, 'java.lang.String.equals(java.lang.Object)'),
  call(PAY, 'java.lang.String.equals(java.lang.Object)'),
  call(PAY, 'app.Card.chargeCash(int)'),
  call(PAY, 'app.Card.chargeCrypto(int)'),
  call(PAY, 'app.Card.chargePaypal(int)'),
  call(PAY, 'app.Card.chargeCard(int)'),
  call(SHIP, 'app.Card.a()'),
  call(SHIP, 'app.Card.b()'),
  call(SHIP, 'app.Card.c()'),
  call(SHIP, 'app.Card.d()', false),
];

export const makeLongConditionalAsg = () => new CodebaseASG(nodes, edges);
