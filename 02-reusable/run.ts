import 'dotenv/config';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  // Change model as needed: gpt-4o, gpt-4o-mini, claude-3-5-sonnet-20241022, gemini-3.0-pro, etc.
  MODEL: process.env.AI_MODEL || 'gpt-4o',
  PROVIDER: process.env.AI_PROVIDER || 'openai', // 'openai', 'anthropic', or 'google'
  TEMPLATE_FILE: './02-reusable/prompt-template.md',
  OUTPUT_DIR: './02-reusable/outputs',
  SAVE_OUTPUT: true,
  // Gemini-specific settings
  GEMINI_THINKING_LEVEL: process.env.GEMINI_THINKING_LEVEL || 'medium',
};

// Variables to inject into the template
// MODIFY THESE FOR YOUR USE CASE
const VARIABLES = {
  ROLE: "Senior Technical Architect",
  TASK_DESCRIPTION: "Analyze this system design and identify potential bottlenecks",
  CONTEXT: "This is for a high-traffic e-commerce platform expecting 1M users/day",
  INPUT_DATA: `
    System: REST API -> Node.js Backend -> PostgreSQL Database
    Current Issues: Slow response times during peak hours
    Infrastructure: Single server, 16GB RAM, 4 CPUs
  `,
  OUTPUT_FORMAT: "Structured analysis with: issues (array), recommendations (array), priority (high/medium/low)",
  CONSTRAINT_1: "Consider cost-effective solutions",
  CONSTRAINT_2: "Minimize downtime during implementation",
  CONSTRAINT_3: "Maintain backward compatibility",
};

/**
 * Load and process the prompt template
 */
function loadTemplate(templatePath: string, variables: Record<string, string>): string {
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace all placeholders {KEY} with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    template = template.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  return template;
}

/**
 * Get the appropriate AI model based on provider
 */
function getModel(provider: string, modelName: string) {
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return anthropic(modelName);
    case 'google':
    case 'gemini':
      // Special handling for Gemini deep think mode
      const settings: any = {};
      if (CONFIG.GEMINI_THINKING_LEVEL === 'high' && modelName.includes('3.0')) {
        settings.experimentalDeepThinking = true;
        settings.maxThinkingTokens = 50000;
      }
      return google(modelName, settings);
    case 'openai':
    default:
      return openai(modelName);
  }
}

/**
 * Save output to file with timestamp
 */
function saveOutput(content: string, outputDir: string): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `output-${timestamp}.md`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, content);
  return filepath;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Pattern 02: Reusable Prompt Runner\n');
  console.log(`📋 Loading template from: ${CONFIG.TEMPLATE_FILE}`);
  console.log(`🤖 Using model: ${CONFIG.MODEL} (${CONFIG.PROVIDER})\n`);

  try {
    // 1. Load and process template
    const prompt = loadTemplate(CONFIG.TEMPLATE_FILE, VARIABLES);
    console.log('📝 Prompt prepared with variables injected\n');
    console.log('--- PROCESSED PROMPT ---');
    console.log(prompt.substring(0, 500) + '...\n'); // Show first 500 chars

    // 2. Get AI model
    const model = getModel(CONFIG.PROVIDER, CONFIG.MODEL);

    // 3. Generate response
    console.log('🔄 Sending to AI...\n');
    const result = await generateText({
      model,
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 4. Display result
    console.log('--- AI RESPONSE ---\n');
    console.log(result.text);
    console.log('\n--- END RESPONSE ---\n');

    // 5. Optionally save output
    if (CONFIG.SAVE_OUTPUT) {
      const outputPath = saveOutput(result.text, CONFIG.OUTPUT_DIR);
      console.log(`✅ Output saved to: ${outputPath}`);
    }

    // 6. Show usage stats
    if (result.usage) {
      console.log('\n📊 Token Usage:');
      console.log(`   Prompt tokens: ${result.usage.promptTokens}`);
      console.log(`   Completion tokens: ${result.usage.completionTokens}`);
      console.log(`   Total tokens: ${result.usage.totalTokens}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { loadTemplate, getModel, saveOutput };