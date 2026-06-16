const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

export interface OllamaOptions {
  model?: string;
  temperature?: number;
  num_predict?: number;
}

export async function callOllama(
  messages: OllamaMessage[],
  options: OllamaOptions = {}
): Promise<string> {
  const {
    model = 'qwen3-vl:latest',
    temperature = 0.7,
    num_predict = 1024,
  } = options;

  const response = await fetch(`${OLLAMA_HOST}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature,
        num_predict,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function callOllamaStream(
  messages: OllamaMessage[],
  onChunk: (chunk: string) => void,
  options: OllamaOptions = {}
): Promise<string> {
  const {
    model = 'qwen3-vl:latest',
    temperature = 0.7,
    num_predict = 1024,
  } = options;

  const response = await fetch(`${OLLAMA_HOST}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        temperature,
        num_predict,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullContent;
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
