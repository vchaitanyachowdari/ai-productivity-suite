import { GoogleGenAI } from "@google/genai";
import OpenAI from 'openai';

export const models = {
  gemini: ['gemini-1.5-flash', 'gemini-1.0-pro'],
  openrouter: [
    'openai/gpt-oss-20b:free',
    'meta-llama/Llama-3-8b-chat-hf',
    'mistralai/mistral-small-3.2-24b-instruct:free',
    'meta-llama/llama-4-maverick:free',
    'meta-llama/llama-4-scout:free',
    'qwen/qwen2.5-vl-32b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'google/gemma-3-4b-it:free',
    'google/gemma-3-12b-it:free',
    'google/gemma-3-27b-it:free',
    'qwen/qwen2.5-vl-72b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
  ],
};

const buildNotesPrompt = ({ noteType, context, rawNotes, useCase }) => {
  let prompt = `You are an expert assistant for transforming raw notes into professionally formatted documents.\n\nFirst, expand all abbreviations and fix typos. Stay true to the original content.\n\nThen, format the notes for the following use case: **${useCase}**.\n\n**Note Type:** ${noteType}\n`;
  prompt += '**Context:**\n';
  for (const [key, value] of Object.entries(context)) {
    if (value) prompt += `- ${key}: ${value}\n`;
  }
  prompt += `\n**Raw Notes:**\n---\n${rawNotes}\n---\n\n**Formatted Output:**\n`;
  return prompt;
};

const buildEmailPrompt = ({ rawText, emailToReply, tone }) => {
  let prompt = `You are an expert email writing assistant. Your task is to transform the user's raw thoughts into a polished, professional email with a specific tone: **${tone}**.\n\n`;
  if (emailToReply) {
    prompt += `The user is replying to the following email:\n---\n${emailToReply}\n---\n\n`;
  }
  prompt += `Here are the user's raw thoughts on what they want to say:\n---\n${rawText}\n---\n\nGenerate the complete email now.`;
  return prompt;
};

const buildFlashcardPrompt = ({ topic }) => {
  return `You are a helpful assistant that creates educational flashcards. Based on the following topic, generate a list of 10 flashcards with a "term" and a "definition". Return the output as a valid JSON array of objects, where each object has a "term" key and a "definition" key. Ensure the JSON is correctly formatted and can be parsed directly.\n\nTopic: ${topic}`;
};

const buildBrainstormingPrompt = ({ companyName, product, timeline, teamGoals, sessionType }) => {
  return `You are an AI brainstorming assistant. Your goal is to help a team generate innovative ideas based on their specific context.\n\nFirst, provide a concise summary of your understanding of the company and product context provided below. This summary should be 2-3 sentences long and demonstrate that you've grasped the core information.\n\nThen, generate 6 distinct and relevant ideas for a **${sessionType}** session. For each idea, provide a brief title, a 1-2 sentence description, a Priority (Low, Medium, High), an Effort Needed (Low, Medium, High), and an Impact Level (Low, Medium, High). The ideas should be directly contextual to the company and product described.\n\nReturn your response as a valid JSON object with two top-level keys: "summary" (string) and "ideas" (an array of 6 idea objects). Each idea object should have keys: "title", "description", "priority", "effort", "impact".\n\n**Company Name:** ${companyName}\n**Product:** ${product}\n**Timeline:** ${timeline}\n**Team Goals:** ${teamGoals}\n**Session Type:** ${sessionType}\n\nExample JSON structure:\n{
  "summary": "[Your understanding summary here]",
  "ideas": [
    {
      "title": "Idea 1 Title",
      "description": "Idea 1 description.",
      "priority": "High",
      "effort": "Medium",
      "impact": "High"
    },
    // ... 5 more ideas
  ]
}`;
};

const buildMeetingSummaryPrompt = ({ rawNotes }) => {
  return `You are an expert meeting notes summarizer. Your task is to convert the following raw meeting notes or transcript into a structured, easy-to-read summary. Focus on key decisions, action items, and important discussion points. The summary should be concise and well-formatted.\n\n**Raw Meeting Notes/Transcript:**\n---\n${rawNotes}\n---\n\n**Structured Summary:**\n`;
};

const buildCsvVisualizerPrompt = ({ firstFiveRows, analysisDescription }) => {
  return `You are an expert data analyst. Your task is to generate Javascript code to analyze CSV data based on a user's request. The data will be provided as a Javascript object with 'headers' (string[]) and 'rows' (any[][]) properties. The first 5 rows of the CSV are provided as a sample. Your generated code will be executed in a browser environment.\n\nYour code must define a global variable named \`analysisResult\` with the following structure:\n\`\`\`javascript\nanalysisResult = {\n  type: 'bar_chart' | 'line_chart' | 'table' | 'count',\n  data: <appropriate data structure>,\n  config: <optional configuration object>\n};\n\`\`\`\n\nData structure requirements by type:\n- bar_chart: \`{ labels: string[], values: number[], title?: string }\`\n- line_chart: \`{ labels: string[], values: number[], title?: string }\`\n- table: \`{ headers: string[], rows: any[][] }\`\n- count: \`{ value: number, label?: string }\`\n\nAdditional requirements:\n- Choose the most appropriate visualization type based on the analysis.\n- For numeric aggregations (sum, average, count), use 'count' type.\n- For comparisons between categories, use 'bar_chart'.\n- For trends over time, use 'line_chart'.\n- For detailed data inspection or pivot tables use 'table'.\n- Include meaningful labels and titles where appropriate.\n- Handle edge cases gracefully (empty data, missing values, etc.).\n- The generated code should be self-contained and directly assign to the global \`analysisResult\` variable.\n- Do NOT include any imports or external libraries. Only use standard Javascript.\n\n**Sample of first 5 rows of data:**\n\`\`\`csv\n${firstFiveRows}\n\`\`\`\n\n**User's requested analysis:**\n${analysisDescription}\n\nGenerate ONLY the Javascript code. Do NOT include any explanations or markdown outside the code block. The code should start directly with \`analysisResult = {\`.\n`;
};

const transformWithGemini = async ({ model, prompt, maxOutputTokens }) => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not set.");
  const genAI = new GoogleGenAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });
  const result = await geminiModel.generateContent({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxOutputTokens || 1024 },
  });
  return result.response.text();
};

const transformWithOpenRouter = async ({ model, prompt, maxOutputTokens }) => {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key is not set.");
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ "role": "user", "content": prompt }],
    max_tokens: maxOutputTokens || 1024,
  });
  if (!completion.choices?.[0]?.message?.content) {
    throw new Error("Invalid response structure from OpenRouter API.");
  }
  return completion.choices[0].message.content;
};

export const transformNotes = async (params) => {
  let prompt;
  let maxOutputTokens = 1024; // Default token limit

  if (params.tool === 'notes') {
    prompt = buildNotesPrompt(params);
  } else if (params.tool === 'email') {
    prompt = buildEmailPrompt(params);
  } else if (params.tool === 'flashcards') {
    prompt = buildFlashcardPrompt(params);
  } else if (params.tool === 'brainstorming') {
    prompt = buildBrainstormingPrompt(params);
  } else if (params.tool === 'meeting_summary') {
    prompt = buildMeetingSummaryPrompt(params);
  } else if (params.tool === 'csv_visualizer') {
    prompt = buildCsvVisualizerPrompt(params);
    maxOutputTokens = 16000; // Set to 16k for code generation
  } else {
    throw new Error('Invalid tool specified');
  }

  try {
    if (params.provider === 'gemini') {
      return await transformWithGemini({ model: params.model, prompt, maxOutputTokens });
    } else if (params.provider === 'openrouter') {
      return await transformWithOpenRouter({ model: params.model, prompt, maxOutputTokens });
    } else {
      throw new Error('Invalid provider selected');
    }
  } catch (error) {
    console.error(`${params.provider} API Error:`, error);
    throw new Error(`API Error from ${params.provider}: ${error.message}`);
  }
};