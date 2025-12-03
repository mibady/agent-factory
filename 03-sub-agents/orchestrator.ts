import 'dotenv/config';
import { generateText, tool, CoreTool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Configuration
const CONFIG = {
  MAIN_MODEL: process.env.ORCHESTRATOR_MODEL || 'gpt-4o',
  SUB_AGENT_MODEL: process.env.SUB_AGENT_MODEL || 'gpt-4o-mini',
  PROVIDER: process.env.AI_PROVIDER || 'openai',
  GEMINI_THINKING_LEVEL: process.env.GEMINI_THINKING_LEVEL || 'medium',
};

/**
 * Get model based on provider
 */
function getModel(modelName: string, provider: string = CONFIG.PROVIDER, useDeepThink: boolean = false) {
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return anthropic(modelName);
    case 'google':
    case 'gemini':
      const settings: any = {};
      // Enable deep think mode for complex orchestration
      if ((useDeepThink || CONFIG.GEMINI_THINKING_LEVEL === 'high') && modelName.includes('3.0')) {
        settings.experimentalDeepThinking = true;
        settings.maxThinkingTokens = 50000;
      }
      return google(modelName, settings);
    case 'openai':
    default:
      return openai(modelName);
  }
}

// ============================================
// SUB-AGENT 1: The Researcher
// ============================================
const researcherAgent = async (topic: string): Promise<string> => {
  console.log(`  🔍 [Researcher] Investigating: "${topic}"`);

  const { text } = await generateText({
    model: getModel(CONFIG.SUB_AGENT_MODEL),
    system: `You are a research specialist. Your job is to:
      1. Find key facts and data
      2. Identify trends and patterns
      3. Provide citations when possible
      4. Be concise but thorough
      5. Focus on actionable insights`,
    prompt: `Research this topic thoroughly: ${topic}`,
    temperature: 0.3, // Lower temperature for factual research
  });

  console.log(`  ✅ [Researcher] Completed research`);
  return text;
};

// ============================================
// SUB-AGENT 2: The Analyst
// ============================================
const analystAgent = async (data: string, focus: string): Promise<string> => {
  console.log(`  📊 [Analyst] Analyzing data with focus: "${focus}"`);

  const { text } = await generateText({
    model: getModel(CONFIG.SUB_AGENT_MODEL),
    system: `You are a data analyst. Your job is to:
      1. Break down complex information
      2. Identify key metrics and KPIs
      3. Find correlations and causations
      4. Provide data-driven recommendations
      5. Use structured thinking`,
    prompt: `Analyze this data with focus on ${focus}:\n\n${data}`,
    temperature: 0.4,
  });

  console.log(`  ✅ [Analyst] Analysis complete`);
  return text;
};

// ============================================
// SUB-AGENT 3: The Writer
// ============================================
const writerAgent = async (content: string, style: string, format: string): Promise<string> => {
  console.log(`  ✏️ [Writer] Creating ${format} in ${style} style`);

  const { text } = await generateText({
    model: getModel(CONFIG.SUB_AGENT_MODEL),
    system: `You are an expert writer. Your job is to:
      1. Write in the requested style and format
      2. Ensure clarity and engagement
      3. Maintain logical flow
      4. Use appropriate tone
      5. Format for readability`,
    prompt: `Transform this content into a ${format} using ${style} style:\n\n${content}`,
    temperature: 0.8, // Higher temperature for creativity
  });

  console.log(`  ✅ [Writer] Document created`);
  return text;
};

// ============================================
// SUB-AGENT 4: The Critic
// ============================================
const criticAgent = async (content: string, criteria: string[]): Promise<string> => {
  console.log(`  🎯 [Critic] Reviewing against criteria:`, criteria);

  const { text } = await generateText({
    model: getModel(CONFIG.SUB_AGENT_MODEL),
    system: `You are a quality assurance specialist. Your job is to:
      1. Evaluate content against specific criteria
      2. Identify strengths and weaknesses
      3. Suggest concrete improvements
      4. Rate quality on a scale of 1-10
      5. Be constructive but honest`,
    prompt: `Review this content against these criteria: ${criteria.join(', ')}\n\nContent:\n${content}`,
    temperature: 0.5,
  });

  console.log(`  ✅ [Critic] Review complete`);
  return text;
};

// ============================================
// SUB-AGENT 5: The Strategist
// ============================================
const strategistAgent = async (goal: string, constraints: string[], resources: string[]): Promise<string> => {
  console.log(`  🎯 [Strategist] Planning for: "${goal}"`);

  const { text } = await generateText({
    model: getModel(CONFIG.SUB_AGENT_MODEL),
    system: `You are a strategic planner. Your job is to:
      1. Create actionable step-by-step plans
      2. Consider constraints and resources
      3. Identify risks and mitigations
      4. Set measurable milestones
      5. Prioritize tasks effectively`,
    prompt: `Create a strategy to achieve: ${goal}\n\nConstraints: ${constraints.join(', ')}\nResources: ${resources.join(', ')}`,
    temperature: 0.6,
  });

  console.log(`  ✅ [Strategist] Strategy developed`);
  return text;
};

// ============================================
// MAIN ORCHESTRATOR
// ============================================
async function runOrchestrator(goal: string) {
  console.log('🎭 Starting Multi-Agent Orchestrator\n');
  console.log(`🎯 Goal: ${goal}\n`);
  console.log('=' .repeat(60));

  const { text, toolCalls, toolResults } = await generateText({
    model: getModel(CONFIG.MAIN_MODEL),
    system: `You are a Project Manager orchestrating a team of specialist agents.

    Your team includes:
    - Researcher: Gathers information and facts
    - Analyst: Analyzes data and finds insights
    - Writer: Creates content in various formats
    - Critic: Reviews and improves quality
    - Strategist: Creates actionable plans

    Your job is to:
    1. Break down the goal into tasks
    2. Delegate to the appropriate specialists
    3. Coordinate their outputs
    4. Synthesize results into a final deliverable
    5. Ensure quality and completeness

    Think step by step and use your team effectively.`,

    prompt: `Achieve this goal: ${goal}`,

    tools: {
      research_topic: tool({
        description: 'Ask the researcher to gather information on a topic',
        parameters: z.object({
          topic: z.string().describe('The topic to research')
        }),
        execute: async ({ topic }) => {
          const result = await researcherAgent(topic);
          return result;
        },
      }),

      analyze_data: tool({
        description: 'Ask the analyst to analyze data with a specific focus',
        parameters: z.object({
          data: z.string().describe('The data to analyze'),
          focus: z.string().describe('What to focus the analysis on')
        }),
        execute: async ({ data, focus }) => {
          const result = await analystAgent(data, focus);
          return result;
        },
      }),

      write_content: tool({
        description: 'Ask the writer to create content',
        parameters: z.object({
          content: z.string().describe('Source content to transform'),
          style: z.string().describe('Writing style (formal, casual, technical, creative)'),
          format: z.string().describe('Output format (blog, report, email, documentation)')
        }),
        execute: async ({ content, style, format }) => {
          const result = await writerAgent(content, style, format);
          return result;
        },
      }),

      review_content: tool({
        description: 'Ask the critic to review and improve content',
        parameters: z.object({
          content: z.string().describe('Content to review'),
          criteria: z.array(z.string()).describe('Evaluation criteria')
        }),
        execute: async ({ content, criteria }) => {
          const result = await criticAgent(content, criteria);
          return result;
        },
      }),

      create_strategy: tool({
        description: 'Ask the strategist to create an action plan',
        parameters: z.object({
          goal: z.string().describe('The goal to achieve'),
          constraints: z.array(z.string()).describe('Constraints to consider'),
          resources: z.array(z.string()).describe('Available resources')
        }),
        execute: async ({ goal, constraints, resources }) => {
          const result = await strategistAgent(goal, constraints, resources);
          return result;
        },
      }),
    },

    maxSteps: 10, // Allow orchestrator to make multiple delegations
    temperature: 0.7,
  });

  console.log('\n' + '=' .repeat(60));
  console.log('📋 FINAL OUTPUT\n');
  console.log(text);
  console.log('\n' + '=' .repeat(60));

  // Show work summary
  if (toolCalls && toolCalls.length > 0) {
    console.log('\n📊 Work Summary:');
    console.log(`   Total delegations: ${toolCalls.length}`);
    const agentCalls: Record<string, number> = {};
    toolCalls.forEach(call => {
      const agent = call.toolName.split('_')[0];
      agentCalls[agent] = (agentCalls[agent] || 0) + 1;
    });
    Object.entries(agentCalls).forEach(([agent, count]) => {
      console.log(`   - ${agent}: ${count} task(s)`);
    });
  }
}

// ============================================
// EXAMPLE USAGE
// ============================================
async function main() {
  // Example 1: Blog Post Creation
  // await runOrchestrator(
  //   "Create a comprehensive blog post about the future of AI agents in software development"
  // );

  // Example 2: Business Analysis
  // await runOrchestrator(
  //   "Analyze the e-commerce market and create a strategy for launching a sustainable fashion brand"
  // );

  // Example 3: Technical Documentation
  await runOrchestrator(
    "Research WebAssembly, analyze its performance benefits, and create technical documentation for developers"
  );
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { runOrchestrator, researcherAgent, analystAgent, writerAgent, criticAgent, strategistAgent };