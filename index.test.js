import { describe, beforeEach, it, expect, vi, afterEach } from "vitest";
import path from "path";
import { fs, vol } from "memfs";

vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("jsonSchemaToDiagram", () => {
  let jsonSchemaToDiagram;
  const startMarker = "<!-- MERMAID_DIAGRAM_START -->";
  const endMarker = "<!-- MERMAID_DIAGRAM_END -->";

  beforeEach(async () => {
    vi.restoreAllMocks();
    process.env.OPENAI_API_KEY = "test-api-key";
    vol.reset();

    vol.fromJSON({
      "./README.md":
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
    const filePath = "./README.md";
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
    const filePath = "./README.md";
    const systemPrompt = "test system prompt";
    const model = "test model";
    const jsonSchema = { tools: [] };

    vol.fromJSON({
      "./README.md": "No markers here",
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

  it("logs error if there is an error processing the file", async () => {
    const filePath = "./README.md";
    const systemPrompt = "test system prompt";
    const model = "test model";
    const jsonSchema = { tools: [] };

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
      `Error processing ${filePath}:`,
      expect.any(Error)
    );
  });
});
