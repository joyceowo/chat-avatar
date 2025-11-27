/**
 * LlmAdapterFactory - Factory for creating LLM adapters
 * Follows Factory and Strategy patterns
 */

import type { ILlmAdapter, ILlmAdapterFactory } from '@/common/interfaces';
import type { EmotionAnalysis } from '@/common/types';
import { AvatarState, LlmProvider } from '@/common/types';

/**
 * Base adapter with common functionality
 */
abstract class BaseLlmAdapter implements ILlmAdapter {
  constructor(
    protected apiKey: string,
    protected modelName: string
  ) {}

  abstract analyzeEmotion(text: string): Promise<EmotionAnalysis>;

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  protected parseEmotionFromText(text: string): AvatarState {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('happy') || lowerText.includes('joy')) {
      return AvatarState.HAPPY;
    }
    if (lowerText.includes('sad') || lowerText.includes('disappointed')) {
      return AvatarState.SAD;
    }
    if (lowerText.includes('excited') || lowerText.includes('enthusiastic')) {
      return AvatarState.EXCITED;
    }
    if (lowerText.includes('confused') || lowerText.includes('uncertain')) {
      return AvatarState.CONFUSED;
    }

    return AvatarState.SPEAKING;
  }
}

/**
 * Gemini API adapter
 */
class GeminiAdapter extends BaseLlmAdapter {
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta';

  public async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const prompt = `Analyze the emotion/tone of this AI response and categorize it as one of: happy, sad, excited, confused, or neutral. Response: "${text.slice(0, 500)}"`;

      const response = await fetch(
        `${this.apiUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        emotion: this.parseEmotionFromText(resultText),
        confidence: 0.8,
        reasoning: resultText,
      };
    } catch (error) {
      console.error('Gemini emotion analysis failed:', error);
      return {
        emotion: AvatarState.SPEAKING,
        confidence: 0.5,
      };
    }
  }
}

/**
 * OpenAI API adapter
 */
class OpenAiAdapter extends BaseLlmAdapter {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  public async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `Analyze the emotion/tone of this AI response and categorize it as one of: happy, sad, excited, confused, or neutral. Response: "${text.slice(0, 500)}"`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 50,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.choices?.[0]?.message?.content || '';

      return {
        emotion: this.parseEmotionFromText(resultText),
        confidence: 0.8,
        reasoning: resultText,
      };
    } catch (error) {
      console.error('OpenAI emotion analysis failed:', error);
      return {
        emotion: AvatarState.SPEAKING,
        confidence: 0.5,
      };
    }
  }
}

/**
 * No-op adapter when LLM is disabled
 */
class NoOpAdapter implements ILlmAdapter {
  public async analyzeEmotion(_text: string): Promise<EmotionAnalysis> {
    return {
      emotion: AvatarState.SPEAKING,
      confidence: 1.0,
    };
  }

  public isConfigured(): boolean {
    return true;
  }
}

/**
 * Factory implementation
 */
export class LlmAdapterFactory implements ILlmAdapterFactory {
  public create(
    provider: string,
    config: { apiKey?: string; modelName?: string }
  ): ILlmAdapter {
    switch (provider) {
      case LlmProvider.GEMINI:
        return new GeminiAdapter(
          config.apiKey || '',
          config.modelName || 'gemini-pro'
        );
      case LlmProvider.OPENAI:
        return new OpenAiAdapter(
          config.apiKey || '',
          config.modelName || 'gpt-3.5-turbo'
        );
      case LlmProvider.NONE:
      default:
        return new NoOpAdapter();
    }
  }
}
