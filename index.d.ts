import { Model } from "@ai-sdk/openai";

export type Options = {
  /**
   * The path to the file to update.
   * @default "./README.md"
   */
  readonly filePath?: string;

  /**
   * The start marker of the diagram in the file.
   * @default "<!-- MERMAID_DIAGRAM_START -->"
   */
  readonly startMarker?: string;

  /**
   * The end marker of the diagram in the file.
   * @default "<!-- MERMAID_DIAGRAM_END -->"
   */
  readonly endMarker?: string;

  /**
   * The system prompt for the LLM.
   */
  readonly systemPrompt?: string;

  /**
   * The LLM model to use.
   * @default openai("gpt-4o")
   */
  readonly model?: Model;

  /**
   * The JSON schema of the tools.
   */
  readonly jsonSchema: object;
};

/**
 * Generate a mermaid diagram from a JSON schema of tools.
 *
 * @param options - The options for the diagram generation.
 * @returns A promise that resolves when the diagram is successfully updated.
 *
 * @example
 * ```javascript
 * import jsonSchemaToDiagram from 'json-schema-to-diagram';
 *
 * const options = {
 *   jsonSchema: { /* your JSON schema here *\/ },
 * };
 *
 * await jsonSchemaToDiagram(options);
 * ```
 */
export default function jsonSchemaToDiagram(options: Options): Promise<void>;
