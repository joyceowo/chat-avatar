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

    // Check for each emotion in order of specificity
    if (lowerText.includes('angry') || lowerText.includes('furious') || lowerText.includes('frustrated')) {
      return AvatarState.ANGRY;
    }
    if (lowerText.includes('surprised') || lowerText.includes('shocked') || lowerText.includes('astonished')) {
      return AvatarState.SURPRISED;
    }
    if (lowerText.includes('worried') || lowerText.includes('anxious') || lowerText.includes('concerned')) {
      return AvatarState.WORRIED;
    }
    if (lowerText.includes('excited') || lowerText.includes('enthusiastic') || lowerText.includes('thrilled')) {
      return AvatarState.EXCITED;
    }
    if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('delighted')) {
      return AvatarState.HAPPY;
    }
    if (lowerText.includes('sad') || lowerText.includes('disappointed') || lowerText.includes('unhappy')) {
      return AvatarState.SAD;
    }
    if (lowerText.includes('confused') || lowerText.includes('uncertain') || lowerText.includes('puzzled')) {
      return AvatarState.CONFUSED;
    }
    if (lowerText.includes('neutral') || lowerText.includes('calm') || lowerText.includes('composed')) {
      return AvatarState.NEUTRAL;
    }

    return AvatarState.NEUTRAL;
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
        emotion: AvatarState.IDLE,
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
        emotion: AvatarState.IDLE,
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

    // Define emotion keywords with weights (higher weight = stronger indicator)
    const emotionKeywords = {
      happy: {
        strong: ['太好了', '非常開心', '超級開心', '真是太棒了', 'excellent', 'wonderful', 'fantastic', '😄', '🎊'],
        medium: ['很棒', '恭喜', '成功', '完美', '優秀', '讚', '厲害', 'great', 'awesome', 'perfect', 'amazing', '😊'],
        weak: ['開心', '高興', '快樂', '喜歡', '感謝', '謝謝', 'good', 'nice', 'happy', 'glad', 'thank'],
      },
      sad: {
        strong: ['非常遺憾', '太糟糕了', '真是失望', '徹底失敗', 'terrible', 'horrible', 'devastating', '😭', '💔'],
        medium: ['抱歉', '遺憾', '可惜', '失望', '難過', '傷心', '不幸', 'sorry', 'unfortunately', 'sad', 'disappointed', '😢'],
        weak: ['失敗', '錯誤', '問題', '壞', '差', 'fail', 'error', 'problem', 'issue', 'bad', 'wrong', '😞'],
      },
      excited: {
        strong: ['太棒了！', '不可思議！', '哇！', '驚人！', '超讚！', 'wow!', 'incredible!', 'amazing!', '🎉', '🚀', '🔥'],
        medium: ['太棒了', '驚人', '不可思議', '哇', '酷', '超級', '極了', '讚爆', 'wow', 'incredible', 'fantastic', 'brilliant', '✨'],
        weak: ['令人興奮', '精彩', '絕佳', '有趣', '不錯', 'exciting', 'cool', 'awesome', 'great'],
      },
      confused: {
        strong: ['完全不懂', '太複雜了', '搞不清楚', 'totally confused', 'no idea', 'completely lost', '❓❓'],
        medium: ['不確定', '困惑', '疑問', '不太明白', '難以理解', 'uncertain', 'confused', 'unclear', 'not sure', '🤔'],
        weak: ['可能', '也許', '或許', '不清楚', '複雜', 'maybe', 'perhaps', 'possibly', 'difficult', 'complex'],
      },
      angry: {
        strong: ['太過分了', '氣死了', '受夠了', '什麼鬼', 'outrageous', 'furious', 'pissed off', '😡', '💢'],
        medium: ['生氣', '憤怒', '煩', '討厭', '受不了', '太誇張', 'angry', 'frustrated', 'annoyed', 'ridiculous', '😠'],
        weak: ['不滿', '煩躁', '不爽', '到底', 'irritated', 'upset', 'bothered'],
      },
      surprised: {
        strong: ['天啊！', '不會吧！', '真的假的！', '震驚！', '嚇到了！', '嚇一跳', 'oh my god!', 'omg!', 'no way!', 'what!', 'shocking!', '😱', '🤯'],
        medium: ['驚訝', '意外', '沒想到', '竟然', '居然', '想不到', '出乎意料', 'surprised', 'unexpected', 'astonishing', '😲'],
        weak: ['咦', '欸', 'whoa', 'huh'],
      },
      worried: {
        strong: ['非常擔心', '很害怕', '恐懼', '焦慮不安', 'very worried', 'terrified', 'anxious', '😰', '😨'],
        medium: ['擔心', '害怕', '緊張', '不安', '憂慮', 'worried', 'concerned', 'nervous', 'afraid', '😟'],
        weak: ['小心', '注意', '謹慎', '留意', 'careful', 'cautious', 'watch out'],
      },
      neutral: {
        strong: ['了解', '明白了', '知道了', '好的', '收到', 'understood', 'got it', 'okay', 'alright'],
        medium: ['是的', '對', '沒錯', '確實', '原來', '這樣啊', 'yes', 'correct', 'right', 'indeed', 'i see'],
        weak: ['嗯', '喔', '哦', '嗯嗯', 'ok', 'sure', 'fine', 'oh', 'really', 'interesting'],
      },
    };

    // Calculate scores with weights
    const scores: Record<string, number> = {
      happy: 0,
      sad: 0,
      excited: 0,
      confused: 0,
      angry: 0,
      surprised: 0,
      worried: 0,
      neutral: 0,
    };

    // Weight multipliers
    const weights = { strong: 3, medium: 2, weak: 1 };

    // Count matches with weights
    Object.entries(emotionKeywords).forEach(([emotion, levels]) => {
      Object.entries(levels).forEach(([level, keywords]) => {
        keywords.forEach(keyword => {
          if (lowerText.includes(keyword.toLowerCase())) {
            scores[emotion] += weights[level as keyof typeof weights];
          }
        });
      });
    });

    // Special patterns for enhanced detection
    if (/[!！]{2,}/.test(text)) {
      scores.excited += 2;
      scores.surprised += 1;
    }
    if (/[?？]{2,}/.test(text)) {
      scores.confused += 2;
    }
    if (/[。.]{3,}/.test(text)) {
      scores.sad += 1;
      scores.worried += 1;
    }

    // Find emotion with highest score
    const maxScore = Math.max(...Object.values(scores));

    // If no keywords matched, return NEUTRAL
    if (maxScore === 0) {
      return AvatarState.NEUTRAL;
    }

    // Map scores to AvatarState
    const emotionMap: Record<string, AvatarState> = {
      happy: AvatarState.HAPPY,
      sad: AvatarState.SAD,
      excited: AvatarState.EXCITED,
      confused: AvatarState.CONFUSED,
      angry: AvatarState.ANGRY,
      surprised: AvatarState.SURPRISED,
      worried: AvatarState.WORRIED,
      neutral: AvatarState.NEUTRAL,
    };

    // Find the emotion with the highest score
    const topEmotion = Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    return emotionMap[topEmotion] || AvatarState.NEUTRAL;
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
