export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface UserDetails {
  email: string;
  name?: string;
  notes?: string;
}

export interface UnknownQuestion {
  question: string;
}

export interface ToolResult {
  recorded: string;
}
