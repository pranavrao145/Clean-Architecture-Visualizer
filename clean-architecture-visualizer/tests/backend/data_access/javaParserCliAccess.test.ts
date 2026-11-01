import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CodebaseASG } from "../../../src/entity/CodebaseASG.js";
import type { CodebaseASGFactory } from "../../../src/entity/CodebaseASGFactory.js";

type ExecFileCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void;

const mockExecFile = jest.fn() as jest.MockedFunction<
  (
    command: string,
    args: string[],
    options: object,
    callback: ExecFileCallback,
  ) => void
>;

jest.unstable_mockModule("node:child_process", () => ({
  execFile: mockExecFile,
  default: { execFile: mockExecFile },
}));

const { JavaParserCliAccess } = await import(
  "../../../src/data_access/JavaParserCliAccess.js"
);

const fixtureJson = readFileSync(
  path.resolve("tests/fixtures/javaparser-cli-output.json"),
  "utf8",
);

const fakeFactory: CodebaseASGFactory = {
  create: async (nodes, edges) => new CodebaseASG(nodes, edges),
};

function mockCliOutput(stdout: string): void {
  mockExecFile.mockImplementation((_command, _args, _options, callback) =>
    callback(null, stdout, ""),
  );
}

function mockCliFailure(message: string, stderr: string): void {
  mockExecFile.mockImplementation((_command, _args, _options, callback) =>
    callback(new Error(message), "", stderr),
  );
}

describe("JavaParserCliAccess", () => {
  let javaParserCliAccess: InstanceType<typeof JavaParserCliAccess>;

  beforeEach(() => {
    jest.clearAllMocks();
    javaParserCliAccess = new JavaParserCliAccess(fakeFactory);
  });

  it("invokes java with the jar and the current working directory", async () => {
    mockCliOutput(fixtureJson);

    await javaParserCliAccess.buildCodebaseASG();

    expect(mockExecFile).toHaveBeenCalledTimes(1);

    const [command, args] = mockExecFile.mock.calls[0]!;

    expect(command).toBe("java");
    expect(args[0]).toBe("-jar");
    expect(args[1]).toMatch(/javaparser-cli-1\.0-SNAPSHOT-all\.jar$/);
    expect(args.slice(2)).toEqual(["--src", process.cwd()]);
  });

  it("builds the ASG nodes exactly as emitted by the CLI", async () => {
    mockCliOutput(fixtureJson);
    const expected = JSON.parse(fixtureJson);

    const asg = await javaParserCliAccess.buildCodebaseASG();

    expect(asg.getNodes()).toEqual(expected.nodes);
  });

  it("builds the ASG edges exactly as emitted by the CLI", async () => {
    mockCliOutput(fixtureJson);
    const expected = JSON.parse(fixtureJson);

    const asg = await javaParserCliAccess.buildCodebaseASG();

    expect(asg.getEdges()).toEqual(expected.edges);
  });

  it("builds an empty ASG for an empty codebase", async () => {
    mockCliOutput(JSON.stringify({ nodes: [], edges: [] }));

    const asg = await javaParserCliAccess.buildCodebaseASG();

    expect(asg.getNodes()).toEqual([]);
    expect(asg.getEdges()).toEqual([]);
  });

  it("rejects when the CLI output is not valid JSON", async () => {
    mockCliOutput("not json");

    await expect(javaParserCliAccess.buildCodebaseASG()).rejects.toThrow(
      "JavaParser CLI produced invalid JSON",
    );
  });

  it("rejects with stderr when the CLI fails", async () => {
    mockCliFailure("exit code 1", "bad source dir");

    await expect(javaParserCliAccess.buildCodebaseASG()).rejects.toThrow(
      /JavaParser CLI failed: exit code 1\nbad source dir/,
    );
  });
});

describe("JavaParser CLI output contract", () => {
  const output = JSON.parse(fixtureJson);

  const nodeTypes = ["CLASS", "INTERFACE", "ENUM", "FIELD", "METHOD"];
  const edgeTypes = [
    "EXTENDS",
    "IMPLEMENTS",
    "HAS_FIELD",
    "HAS_METHOD",
    "MUTATES_FIELD",
    "CALLS",
  ];

  it("only uses known node and edge types", () => {
    for (const node of output.nodes) {
      expect(nodeTypes).toContain(node.type);
    }

    for (const edge of output.edges) {
      expect(edgeTypes).toContain(edge.type);
    }
  });

  it("emits parameterFqns as a string array on every method node", () => {
    const methods = output.nodes.filter((node: any) => node.type === "METHOD");

    expect(methods.length).toBeGreaterThan(0);

    for (const method of methods) {
      expect(Array.isArray(method.parameterFqns)).toBe(true);
    }
  });
});
