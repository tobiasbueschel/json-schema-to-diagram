import { readFile, writeFile } from "fs/promises";
import path from "path";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const DEFAULT_OPTIONS = {
  startMarker: "<!-- MERMAID_DIAGRAM_START -->",
  endMarker: "<!-- MERMAID_DIAGRAM_END -->",
  filePath: "./README.md",
  systemPrompt: `
  <purpose>You are a helpful assistant that generates mermaid diagrams based on a JSON schema of tools.</purpose>
  <instructions>
    <instruction>Use a flowchart diagram with left-to-right orientation.</instruction>
    <instruction>Level 1 of the flowchart should be the category of tools that are similar, everything branches out from there</instruction>
    <instruction>Level 2 of the flowchart should contain individual tools (use bold text for tool names)</instruction>
    <instruction>Between level 1 and level 2, there should be a text link description of the tool</instruction>
    <instruction>Level 3 of the flowchart should contain the tools' parameters in a single box with <br> between each parameter</instruction>
    <instruction>The flowchart should be in the same language as the one used in the file</instruction>
  </instructions>`,
  model: openai("gpt-4o"),
};

/**
 * Generate a mermaid diagram from a JSON schema of tools.
 *
 * @param {Object} options - The options for the diagram generation.
 * @param {string} [options.filePath] - The path to the file to update.
 * @param {string} [options.startMarker] - The start marker of the diagram in the file.
 * @param {string} [options.endMarker] - The end marker of the diagram in the file.
 * @param {string} [options.systemPrompt] - The system prompt for the LLM.
 * @param {Model} [options.model] - The LLM model to use.
 * @param {Object} options.jsonSchema - The JSON schema of the tools.
 */
export default async function jsonSchemaToDiagram(options) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  if (typeof options !== "object" || options === null) {
    throw new Error(`Expected a non-null object`);
  }

  const config = { ...DEFAULT_OPTIONS, ...options };
  const { startMarker, endMarker, filePath, systemPrompt, model, jsonSchema } =
    config;

  const hasAllRequiredOptions =
    filePath && startMarker && endMarker && systemPrompt && model && jsonSchema;

  // If no filepath is provided, throw an error
  if (!hasAllRequiredOptions) {
    throw new Error("Missing required options");
  }

  const fileToUpdatePath = path.join(__dirname, filePath);

  try {
    const data = await readFile(fileToUpdatePath, "utf8");

    const {
      object: { mermaidDiagramString },
    } = await generateObject({
      model,
      system: systemPrompt,
      prompt: `Here is the JSON schema: ${JSON.stringify(jsonSchema)}`,
      schema: z.object({
        mermaidDiagramString: z
          .string()
          .describe(
            "Contains the created diagram strictly following the mermaid syntax."
          ),
      }),
    });

    const diagramContent = `\`\`\`mermaid\n${mermaidDiagramString}\n\`\`\`\n`;

    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");

    if (!regex.test(data)) {
      console.error(`Markers not found in ${filePath}.`);
      return;
    }

    const newContent = data.replace(
      regex,
      `${startMarker}\n${diagramContent}${endMarker}`
    );

    await writeFile(fileToUpdatePath, newContent, "utf8");
    console.log(`Diagram successfully updated in ${filePath}`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}
