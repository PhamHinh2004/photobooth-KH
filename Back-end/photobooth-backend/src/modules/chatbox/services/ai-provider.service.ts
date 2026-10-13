import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderCallResult {
  text: string;
  provider: 'gemini' | 'groq' | 'openrouter' | 'local_fallback';
  modelUsed: string;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  private readonly geminiApiKey: string | undefined;
  private readonly groqApiKey: string | undefined;
  private readonly openRouterApiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY');
  }

  /**
   * Gọi LLM với cơ chế Failover tự động qua nhiều model & provider:
   * 1. Google Gemini (2.0-flash / 1.5-flash)
   * 2. Groq (llama-3.3-70b-versatile / llama-3.1-8b-instant)
   * 3. OpenRouter (Free models)
   * 4. Trả về null nếu không có provider nào hoạt động để kích hoạt Local Knowledge Fallback
   */
  async generateCompletionWithFallback(
    messages: ChatMessagePayload[],
    systemInstruction: string,
  ): Promise<ProviderCallResult | null> {
    const providersToTry: Array<{
      name: 'gemini' | 'groq' | 'openrouter';
      fn: () => Promise<ProviderCallResult>;
    }> = [];

    // 1. Groq (Tốc độ siêu nhanh 3-4s, ưu tiên phản hồi tức thì cho người dùng)
    if (this.groqApiKey) {
      providersToTry.push({
        name: 'groq',
        fn: () => this.callGroq(messages, systemInstruction),
      });
    }

    // 2. Google Gemini (Dự phòng)
    if (this.geminiApiKey) {
      providersToTry.push({
        name: 'gemini',
        fn: () => this.callGemini(messages, systemInstruction),
      });
    }

    // 3. OpenRouter
    if (this.openRouterApiKey) {
      providersToTry.push({
        name: 'openrouter',
        fn: () => this.callOpenRouter(messages, systemInstruction),
      });
    }

    for (const provider of providersToTry) {
      try {
        this.logger.log(`[AI-Provider] Đang thử provider: ${provider.name}...`);
        const result = await provider.fn();
        if (result && result.text && result.text.trim().length > 0) {
          this.logger.log(`[AI-Provider] Provider ${provider.name} (${result.modelUsed}) phản hồi thành công!`);
          return result;
        }
      } catch (error: any) {
        this.logger.warn(
          `[AI-Provider] Provider ${provider.name} thất bại (${error.message}). Đang tự động chuyển sang provider tiếp theo...`,
        );
      }
    }

    this.logger.warn(
      `[AI-Provider] Tất cả external AI providers không khả dụng hoặc chưa cấu hình API key. Chuyển sang Local Expert Engine!`,
    );
    return null;
  }

  /**
   * Gọi Google Gemini API
   */
  private async callGemini(
    messages: ChatMessagePayload[],
    systemInstruction: string,
  ): Promise<ProviderCallResult> {
    const model = 'gemini-3.8-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;

    // Chuẩn bị contents theo chuẩn Gemini
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini trả về kết quả rỗng');
    }

    return {
      text,
      provider: 'gemini',
      modelUsed: model,
    };
  }

  /**
   * Gọi Groq Cloud API (OpenAI-compatible)
   */
  private async callGroq(
    messages: ChatMessagePayload[],
    systemInstruction: string,
  ): Promise<ProviderCallResult> {
    const model = 'openai/gpt-oss-120b';
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const fullMessages = [
      { role: 'system', content: systemInstruction },
      ...messages,
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.groqApiKey}`,
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Groq trả về kết quả rỗng');
    }

    return {
      text,
      provider: 'groq',
      modelUsed: model,
    };
  }

  /**
   * Gọi OpenRouter API (OpenAI-compatible)
   */
  private async callOpenRouter(
    messages: ChatMessagePayload[],
    systemInstruction: string,
  ): Promise<ProviderCallResult> {
    const model = 'meta-llama/llama-3.3-70b-instruct:free';
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const fullMessages = [
      { role: 'system', content: systemInstruction },
      ...messages,
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openRouterApiKey}`,
        'HTTP-Referer': 'https://photobooth-kh.local',
        'X-Title': 'Photobooth Assistant',
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('OpenRouter trả về kết quả rỗng');
    }

    return {
      text,
      provider: 'openrouter',
      modelUsed: model,
    };
  }
}
