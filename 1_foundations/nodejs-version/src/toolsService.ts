import { NotificationService } from './notificationService';
import { UserDetails, UnknownQuestion, ToolResult } from './types';

export class ToolsService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async recordUserDetails(params: UserDetails): Promise<ToolResult> {
    const { email, name = 'Name not provided', notes = 'not provided' } = params;
    await this.notificationService.push(`Recording ${name} with email ${email} and notes ${notes}`);
    return { recorded: 'ok' };
  }

  async recordUnknownQuestion(params: UnknownQuestion): Promise<ToolResult> {
    const { question } = params;
    await this.notificationService.push(`Recording ${question}`);
    return { recorded: 'ok' };
  }

  getToolDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'record_user_details',
          description: 'Use this tool to record that a user is interested in being in touch and provided an email address',
          parameters: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                description: 'The email address of this user'
              },
              name: {
                type: 'string',
                description: "The user's name, if they provided it"
              },
              notes: {
                type: 'string',
                description: "Any additional information about the conversation that's worth recording to give context"
              }
            },
            required: ['email'],
            additionalProperties: false
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'record_unknown_question',
          description: "Always use this tool to record any question that couldn't be answered as you didn't know the answer",
          parameters: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: "The question that couldn't be answered"
              }
            },
            required: ['question'],
            additionalProperties: false
          }
        }
      }
    ];
  }

  async executeTool(toolName: string, args: any): Promise<ToolResult> {
    switch (toolName) {
      case 'record_user_details':
        return this.recordUserDetails(args);
      case 'record_unknown_question':
        return this.recordUnknownQuestion(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
