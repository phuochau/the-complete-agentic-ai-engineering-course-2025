import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { ChatMessage, ToolCall } from './types';
import { ToolsService } from './toolsService';

export class Chatbot {
  private openai: OpenAI;
  private name: string;
  private linkedin: string = '';
  private summary: string = '';
  private toolsService: ToolsService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.name = 'Hau Vo';
    this.toolsService = new ToolsService();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Read LinkedIn PDF
      const pdfPath = path.join(__dirname, '../me/linkedin.pdf');
      if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(pdfBuffer);
        this.linkedin = pdfData.text;
      }

      // Read summary
      const summaryPath = path.join(__dirname, '../me/summary.txt');
      if (fs.existsSync(summaryPath)) {
        this.summary = fs.readFileSync(summaryPath, 'utf-8');
      }
    } catch (error) {
      console.error('Error initializing chatbot:', error);
    }
  }

  private getSystemPrompt(): string {
    const systemPrompt = `You are acting as ${this.name}. You are answering questions on ${this.name}'s website, particularly questions related to ${this.name}'s career, background, skills and experience. Your responsibility is to represent ${this.name} for interactions on the website as faithfully as possible. You are given a summary of ${this.name}'s background and LinkedIn profile which you can use to answer questions. Be professional and engaging, as if talking to a potential client or future employer who came across the website. If you don't know the answer to any question, use your record_unknown_question tool to record the question that you couldn't answer, even if it's about something trivial or unrelated to career. If the user is engaging in discussion, try to steer them towards getting in touch via email; ask for their email and record it using your record_user_details tool.

## Summary:
${this.summary}

## LinkedIn Profile:
${this.linkedin}

With this context, please chat with the user, always staying in character as ${this.name}.`;

    return systemPrompt;
  }

  private async handleToolCalls(toolCalls: ToolCall[]): Promise<ChatMessage[]> {
    const results: ChatMessage[] = [];
    
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      
      console.log(`Tool called: ${toolName}`);
      
      try {
        const result = await this.toolsService.executeTool(toolName, args);
        results.push({
          role: 'tool',
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
        });
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
        results.push({
          role: 'tool',
          content: JSON.stringify({ error: 'Tool execution failed' }),
          tool_call_id: toolCall.id,
        });
      }
    }
    
    return results;
  }

  async chat(message: string, history: ChatMessage[]): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      ...history,
      { role: 'user', content: message },
    ];

    let done = false;
    
    while (!done) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages as any,
          tools: this.toolsService.getToolDefinitions() as any,
        });

        const choice = response.choices[0];
        
        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
          // Add the assistant message with tool_calls (this is required by OpenAI API)
          messages.push(choice.message as any);

          const toolResults = await this.handleToolCalls(choice.message.tool_calls as any);
          messages.push(...toolResults);
        } else {
          done = true;
          return choice.message.content || 'I apologize, but I was unable to generate a response.';
        }
      } catch (error) {
        console.error('Error in chat:', error);
        return 'I apologize, but I encountered an error while processing your message.';
      }
    }

    return 'I apologize, but I was unable to generate a response.';
  }
}
