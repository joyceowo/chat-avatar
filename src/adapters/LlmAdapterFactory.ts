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
 * Local emotion analyzer - uses keyword matching (no API required)
 */
class LocalEmotionAdapter implements ILlmAdapter {
  public async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    const emotion = this.analyzeEmotionLocally(text);

    return {
      emotion,
      confidence: 0.7,
      reasoning: 'Local keyword-based analysis',
    };
  }

  public isConfigured(): boolean {
    return true;
  }

  private analyzeEmotionLocally(text: string): AvatarState {
    const lowerText = text.toLowerCase();

    // Happy keywords (positive, cheerful)
    const happyKeywords = [
      '太好了', '很棒', '恭喜', '成功', '完美', '優秀', '讚', '厲害',
      '開心', '高興', '快樂', '喜歡', '愛', '感謝', '謝謝',
      'great', 'awesome', 'excellent', 'perfect', 'wonderful', 'amazing',
      'happy', 'glad', 'love', 'thank', 'congratulations', '😊', '😄', '🎉',
    ];

    // Sad keywords (negative, disappointed)
    const sadKeywords = [
      '抱歉', '遺憾', '可惜', '失望', '難過', '傷心', '不幸', '糟糕',
      '失敗', '錯誤', '問題', '壞', '差',
      'sorry', 'unfortunately', 'sad', 'disappointed', 'fail', 'error',
      'problem', 'issue', 'bad', 'wrong', '😢', '😞',
    ];

    // Excited keywords (enthusiastic, energetic)
    const excitedKeywords = [
      '太棒了', '驚人', '不可思議', '哇', '酷', '超級', '極了',
      '令人興奮', '精彩', '絕佳',
      'wow', 'incredible', 'fantastic', 'brilliant', 'outstanding',
      'exciting', 'amazing', 'spectacular', '🎉', '🚀', '✨',
    ];

    // Confused keywords (uncertain, unclear)
    const confusedKeywords = [
      '不確定', '可能', '也許', '或許', '不清楚', '困惑', '疑問',
      '不太明白', '難以', '複雜',
      'uncertain', 'maybe', 'perhaps', 'confused', 'unclear', 'not sure',
      'difficult', 'complex', 'complicated', '🤔', '❓',
    ];

    // Angry keywords (frustrated, annoyed)
    const angryKeywords = [
      '生氣', '憤怒', '煩', '討厭', '受不了', '太誇張', '到底',
      '什麼鬼', '搞砸', '爛', '糟透了',
      'angry', 'frustrated', 'annoyed', 'terrible', 'awful', 'ridiculous',
      'damn', 'hell', '😠', '😡', '💢',
    ];

    // Count keyword matches
    let happyScore = 0;
    let sadScore = 0;
    let excitedScore = 0;
    let confusedScore = 0;
    let angryScore = 0;

    happyKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) happyScore++;
    });

    sadKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) sadScore++;
    });

    excitedKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) excitedScore++;
    });

    confusedKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) confusedScore++;
    });

    angryKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) angryScore++;
    });

    // Determine emotion based on highest score
    const scores = [
      { emotion: AvatarState.HAPPY, score: happyScore },
      { emotion: AvatarState.SAD, score: sadScore },
      { emotion: AvatarState.EXCITED, score: excitedScore },
      { emotion: AvatarState.CONFUSED, score: confusedScore },
      { emotion: AvatarState.SAD, score: angryScore }, // Map angry to sad for now
    ];

    const maxScore = Math.max(happyScore, sadScore, excitedScore, confusedScore, angryScore);

    // If no keywords matched, use default SPEAKING
    if (maxScore === 0) {
      return AvatarState.SPEAKING;
    }

    // Return the emotion with highest score
    const result = scores.find(s => s.score === maxScore);
    return result?.emotion || AvatarState.SPEAKING;
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
        return new LocalEmotionAdapter();
    }
  }
}
