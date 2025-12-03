import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * Template for creating specialized sub-agents
 * Copy this file and customize for your specific needs
 */

interface SubAgentConfig {
  name: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface SubAgentInput {
  [key: string]: any;
}

/**
 * Base Sub-Agent Template
 * Extend this for your specific use cases
 */
export class SubAgent {
  private config: SubAgentConfig;
  private systemPrompt: string;

  constructor(config: SubAgentConfig, systemPrompt: string) {
    this.config = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
      ...config,
    };
    this.systemPrompt = systemPrompt;
  }

  async execute(input: SubAgentInput): Promise<string> {
    console.log(`  🤖 [${this.config.name}] Processing...`);

    const { text } = await generateText({
      model: openai(this.config.model!),
      system: this.systemPrompt,
      prompt: this.formatPrompt(input),
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    console.log(`  ✅ [${this.config.name}] Complete`);
    return text;
  }

  protected formatPrompt(input: SubAgentInput): string {
    // Override this in subclasses for custom prompt formatting
    return JSON.stringify(input, null, 2);
  }
}

// ============================================
// EXAMPLE: Code Generator Sub-Agent
// ============================================
export class CodeGeneratorAgent extends SubAgent {
  constructor() {
    super(
      { name: 'CodeGenerator', temperature: 0.3 },
      `You are an expert programmer. Generate clean, efficient, and well-commented code.
      Follow best practices and include error handling.`
    );
  }

  protected formatPrompt(input: SubAgentInput): string {
    return `Generate ${input.language} code for: ${input.task}\nRequirements: ${input.requirements}`;
  }
}

// ============================================
// EXAMPLE: Data Extractor Sub-Agent
// ============================================
export class DataExtractorAgent extends SubAgent {
  constructor() {
    super(
      { name: 'DataExtractor', temperature: 0.1 },
      `You are a data extraction specialist. Extract structured data from unstructured text.
      Be precise and maintain data integrity. Output valid JSON.`
    );
  }

  protected formatPrompt(input: SubAgentInput): string {
    return `Extract ${input.dataType} from this text:\n\n${input.text}\n\nOutput format: ${input.format}`;
  }
}

// ============================================
// EXAMPLE: Validator Sub-Agent
// ============================================
export class ValidatorAgent extends SubAgent {
  constructor() {
    super(
      { name: 'Validator', temperature: 0.2 },
      `You are a quality assurance expert. Validate content against requirements.
      Check for errors, inconsistencies, and compliance. Be thorough and precise.`
    );
  }

  protected formatPrompt(input: SubAgentInput): string {
    return `Validate this ${input.type}:\n\n${input.content}\n\nCriteria: ${input.criteria.join(', ')}`;
  }
}

// ============================================
// EXAMPLE: Translator Sub-Agent
// ============================================
export class TranslatorAgent extends SubAgent {
  constructor() {
    super(
      { name: 'Translator', temperature: 0.5 },
      `You are a professional translator. Maintain meaning, tone, and cultural context.
      Ensure natural flow in the target language.`
    );
  }

  protected formatPrompt(input: SubAgentInput): string {
    return `Translate from ${input.sourceLang} to ${input.targetLang}:\n\n${input.text}\n\nContext: ${input.context || 'General'}`;
  }
}

// ============================================
// USAGE EXAMPLE
// ============================================
async function exampleUsage() {
  // Create specialized agents
  const coder = new CodeGeneratorAgent();
  const extractor = new DataExtractorAgent();
  const validator = new ValidatorAgent();

  // Use them independently or in combination
  const code = await coder.execute({
    language: 'TypeScript',
    task: 'REST API endpoint',
    requirements: 'Handle user authentication with JWT',
  });

  const extracted = await extractor.execute({
    dataType: 'email addresses',
    text: 'Contact john@example.com or jane@test.org for details',
    format: 'array of strings',
  });

  const validation = await validator.execute({
    type: 'code',
    content: code,
    criteria: ['security', 'performance', 'readability'],
  });

  return { code, extracted, validation };
}

// Export for use in orchestrator
export default {
  SubAgent,
  CodeGeneratorAgent,
  DataExtractorAgent,
  ValidatorAgent,
  TranslatorAgent,
};