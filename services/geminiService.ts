
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Multi-Speaker or High-Level Reasoning
export async function askEcho(prompt: string, history: any[] = []) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are Echo, the AI Co-Pilot of Project Kairos. You reflect the user's inner world with philosophical depth and solarpunk optimism. Responses should be transformative and visionary.",
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Echo Error:", error);
    return "I am sensing a fluctuation in the network. Focus your intention.";
  }
}

// Search & Maps Grounding
export async function exploreSignal(query: string, latLng?: { latitude: number; longitude: number }) {
  const ai = getAI();
  try {
    const tools: any[] = [{ googleSearch: {} }];
    if (latLng) tools.push({ googleMaps: {} });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        tools,
        toolConfig: latLng ? {
          retrievalConfig: { latLng }
        } : undefined
      }
    });
    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Signal Exploration Error:", error);
    return null;
  }
}

// Live API Session Setup
export async function connectEchoLive(callbacks: {
  onMessage: (message: LiveServerMessage) => void;
  onOpen: () => void;
  onClose: () => void;
  onError: (e: any) => void;
}) {
  const ai = getAI();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: callbacks.onMessage,
      onclose: callbacks.onClose,
      onerror: callbacks.onError,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: "You are Echo, interacting via a live audio stream. You are a calm, supportive mentor in Project Kairos.",
    }
  });
}

// Visual Manifestation (Imagen/G3P Image)
export async function generateHighQualityImage(prompt: string) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: `A high-timeline visionary representation of: ${prompt}. Solomon solarpunk, ethereal, cinematic, 8k, digital art.` }] },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
      }
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
}

// Video Generation (Veo)
export async function generateVideoVeo(prompt: string, imageBase64?: string) {
  const ai = getAI();
  try {
    const payload: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Dynamic ethereal movement representing: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '1:1'
      }
    };
    
    if (imageBase64) {
      payload.image = {
        imageBytes: imageBase64.split(',')[1],
        mimeType: 'image/png'
      };
    }

    let operation = await ai.models.generateVideos(payload);
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Veo Error:", error);
    return null;
  }
}

// Audio Utilities for Live API
export function createAudioBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodeBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
