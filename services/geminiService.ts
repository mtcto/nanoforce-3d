import { GoogleGenAI } from "@google/genai";
import { TextureStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateTextureImage = async (
  prompt: string,
  style: TextureStyle
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  // Construct a prompt optimized for texture generation
  let styleModifier = "";
  switch (style) {
    case TextureStyle.PIXEL_ART:
      styleModifier = "pixel art style, 8-bit graphics, sharp edges, low resolution aesthetic, minecraft block texture";
      break;
    case TextureStyle.VOXEL:
      styleModifier = "voxel art style, blocky, 3d rendered cubes look, isometric feel";
      break;
    case TextureStyle.REALISTIC:
      styleModifier = "photorealistic, high detail, 4k texture, pbr material";
      break;
    case TextureStyle.CARTOON:
      styleModifier = "cartoon style, cel shaded, vibrant colors, bold outlines";
      break;
    case TextureStyle.CYBERPUNK:
      styleModifier = "cyberpunk aesthetic, neon lights, metallic surfaces, high tech, grime, futuristic";
      break;
    case TextureStyle.HAND_PAINTED:
      styleModifier = "hand painted texture, stylized, blizzard style, brush strokes, watercolor";
      break;
  }

  const fullPrompt = `Seamless square texture of ${prompt}. ${styleModifier}. Flat lighting, top-down view, no background context, full frame pattern.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: fullPrompt }],
      },
    });

    // Extract image from response
    let base64Image = "";
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("No image data found in response.");
    }

    return `data:image/png;base64,${base64Image}`;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate texture.");
  }
};