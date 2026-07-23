/**
 * 나노바나나(NanoBanana) / 제미나이(Gemini) 공식 REST 엔드포인트 및 스키마 설정
 */

export interface NanoBananaModelConfig {
  modelName: string
  endpoint: string
  imageSize: '1K' | '2K' | '4K'
  temperature: number
}

export const NANO_BANANA_MODEL_CONFIGS: Record<string, NanoBananaModelConfig> = {
  'nanobanana': {
    modelName: 'gemini-2.5-flash-image',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-image:generateContent',
    imageSize: '1K',
    temperature: 0.7,
  },
  'nanobanana-2-2k': {
    modelName: 'gemini-3.1-flash-image',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent',
    imageSize: '2K',
    temperature: 0.7,
  },
  'nanobanana-2-4k': {
    modelName: 'gemini-3.1-flash-image',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent',
    imageSize: '4K',
    temperature: 0.7,
  },
  'nanobanana-pro': {
    modelName: 'gemini-3-pro-image',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-3-pro-image:generateContent',
    imageSize: '4K',
    temperature: 0.7,
  },
}

export function getNanoBananaConfig(modelType: string): NanoBananaModelConfig {
  return NANO_BANANA_MODEL_CONFIGS[modelType] || NANO_BANANA_MODEL_CONFIGS['nanobanana-2-2k']
}
