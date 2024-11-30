import { describe, beforeEach, it, expect, vi, afterEach } from "vitest";
import path from "path";
import { fs, Volume } from "memfs";

const vol = new Volume();

vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("jsonSchemaToDiagram", () => {
  let jsonSchemaToDiagram;
  const startMarker = "<!-- MERMAID_DIAGRAM_START -->";
  const endMarker = "<!-- MERMAID_DIAGRAM_END -->";
  const resolvedPath = path.resolve(process.cwd(), "./README.md");
  const filePath = "./README.md";

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = "test-api-key";

    vi.mock("node:fs/promises", async () => {
      const memfs = await vi.importActual("memfs");
      return memfs.fs.promises;
    });

    vol.fromJSON({
      resolvedPath:
        "<!-- MERMAID_DIAGRAM_START -->\nOld content\n<!-- MERMAID_DIAGRAM_END -->",
    });

    vi.mock("ai", () => ({
      __esModule: true,
      generateObject: vi.fn().mockResolvedValue({
        object: { mermaidDiagramString: "graph TD; A-->B;" },
      }),
    }));

    const module = await import("./index.js");
    jsonSchemaToDiagram = module.default;
  });

  afterEach(() => {
    vol.reset();
    vi.restoreAllMocks();
  });

  it("throws error if OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(jsonSchemaToDiagram({})).rejects.toThrow(
      "OPENAI_API_KEY is not set"
    );
  });

  it("throws error if options is not an object", async () => {
    await expect(jsonSchemaToDiagram(null)).rejects.toThrow(
      "Expected a non-null object"
    );
  });

  it("throws error if required options are missing", async () => {
    await expect(jsonSchemaToDiagram({})).rejects.toThrow(
      "Missing required options"
    );
  });

  it.todo("updates file with generated mermaid diagram", async () => {
    const systemPrompt = "test system prompt";
    const model = "test model";
    const jsonSchema = { tools: [] };
    const mermaidDiagramString = "graph TD; A-->B;";

    vi.spyOn(fs, "writeFile").mockImplementation(() => {
      return Promise.resolve();
    });

    await jsonSchemaToDiagram({
      filePath,
      startMarker,
      endMarker,
      systemPrompt,
      model,
      jsonSchema,
    });

    const expectedContent = `${startMarker}\n\`\`\`mermaid\n${mermaidDiagramString}\n\`\`\`\n${endMarker}`;
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(__dirname, filePath),
      expectedContent,
      "utf8"
    );
  });

  it.todo("logs error if markers are not found in file", async () => {
    const systemPrompt = "test system prompt";
    const model = "test model";
    const jsonSchema = { tools: [] };

    vol.fromJSON({
      resolvedPath: "No markers here",
    });

    vi.spyOn(console, "error").mockImplementation(() => {});

    await jsonSchemaToDiagram({
      filePath,
      startMarker,
      endMarker,
      systemPrompt,
      model,
      jsonSchema,
    });

    expect(console.error).toHaveBeenCalledWith(
      `Markers not found in ${filePath}:`,
      expect.any(Error)
    );
  });

  it("logs error if the LLM fails to generate the diagram", async () => {
    const systemPrompt = "test system prompt";
    const model = "test model";
    const jsonSchema = { tools: [] };

    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mock("ai", () => ({
      __esModule: true,
      generateObject: vi.fn().mockRejectedValue(new Error("Processing failed")),
    }));

    await jsonSchemaToDiagram({
      filePath,
      startMarker,
      endMarker,
      systemPrompt,
      model,
      jsonSchema,
    });

    expect(console.error).toHaveBeenCalledWith(
      `Error processing ${resolvedPath}:`,
      expect.any(Error)
    );
  });
});
