import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google GenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract base64 data and mime type
function cleanBase64(dataUri: string): { data: string; mimeType: string } {
  const match = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/png', data: dataUri };
}

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'atelier-merch-api' });
});

// 2. AI Logo Intelligence (analysis, color palette, placement suggestions)
app.post('/api/gemini/analyze-logo', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64 in request' });
      return;
    }

    const { data, mimeType } = cleanBase64(imageBase64);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data,
              mimeType,
            },
          },
          {
            text: `Analyze this brand logo / graphic artwork for physical merchandise manufacturing.
Return a structured JSON object with the following fields:
{
  "brandStyle": "Brief 3-5 word style (e.g. Minimalist Streetwear, Vintage Heritage, Neo-Tech)",
  "recommendedPlacement": "optimal placement on apparel (e.g., Center Chest 10in, Left Chest Pocket 3.5in, Oversized Back)",
  "recommendedPrintMethod": "Screenprint Plastisol" | "Direct-to-Garment (DTG)" | "3D Heavy Embroidery" | "Metallic Foil Stamp",
  "printMethodReasoning": "1 sentence explanation why",
  "primaryColors": [
    { "name": "Color name", "hex": "#HEX", "pantoneEstimate": "PMS XXX C" }
  ],
  "recommendedFabricColorways": [
    { "name": "Washed Charcoal", "hex": "#27272a" },
    { "name": "Vintage Chalk Bone", "hex": "#f5f5f4" },
    { "name": "Forest Moss", "hex": "#283618" }
  ],
  "compositionAdvice": "1 practical manufacturing advice tip regarding lines or contrast"
}
Output valid JSON only with no markdown backticks.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Error analyzing logo:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze logo with Gemini',
    });
  }
});

// 3. AI Text-Prompted Image Editing using gemini-nano-banana-2.1
app.post('/api/gemini/edit-image', async (req: Request, res: Response) => {
  try {
    const { prompt, imageBase64, aspectRatio = '4:3' } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Missing prompt in request' });
      return;
    }

    let contentsParts: any[] = [];
    if (imageBase64) {
      const { data, mimeType } = cleanBase64(imageBase64);
      contentsParts.push({
        inlineData: {
          data,
          mimeType,
        },
      });
    }
    contentsParts.push({
      text: prompt,
    });

    // Primary model: gemini-nano-banana-2.1 (supports high-res editing)
    let imageUrl: string | null = null;
    let modelUsed = 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: contentsParts,
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: '1K',
          },
        },
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (primaryErr: any) {
      console.warn('Primary model error, attempting fallback to gemini-3.1-flash-lite-image:', primaryErr.message);
      modelUsed = 'gemini-3.1-flash-lite-image';
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: contentsParts,
        },
      });

      if (fallbackResponse.candidates && fallbackResponse.candidates[0]?.content?.parts) {
        for (const part of fallbackResponse.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({
        error: 'No image data returned from model. Please try refining your prompt.',
      });
      return;
    }

    res.json({
      success: true,
      imageUrl,
      modelUsed,
      prompt,
    });
  } catch (error: any) {
    console.error('Error generating/editing image:', error);
    res.status(500).json({
      error: error.message || 'Image generation failed',
    });
  }
});

// 4. AI New Mockup Scene Generation using text prompt
app.post('/api/gemini/generate-mockup-scene', async (req: Request, res: Response) => {
  try {
    const { prompt, productType = 't-shirt', aspectRatio = '4:3' } = req.body;
    const finalPrompt = `Commercial luxury merchandise studio photograph: ${prompt}. Clean professional lighting, photorealistic product photography, ultra crisp fabric textures, neutral studio aesthetic, 8k resolution.`;

    let imageUrl: string | null = null;
    let modelUsed = 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: '1K',
          },
        },
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (primaryErr: any) {
      console.warn('Fallback to gemini-3.1-flash-lite-image:', primaryErr.message);
      modelUsed = 'gemini-3.1-flash-lite-image';
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: finalPrompt }],
        },
      });

      if (fallbackResponse.candidates && fallbackResponse.candidates[0]?.content?.parts) {
        for (const part of fallbackResponse.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({ error: 'Failed to generate mockup image.' });
      return;
    }

    res.json({
      success: true,
      imageUrl,
      modelUsed,
      productType,
    });
  } catch (error: any) {
    console.error('Error generating scene:', error);
    res.status(500).json({ error: error.message || 'Scene generation failed' });
  }
});

// 5. AI Custom Background Generation from text description
app.post('/api/gemini/generate-background', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '4:3' } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Missing prompt description for background' });
      return;
    }

    const finalPrompt = `Commercial product photography background setting: ${prompt}. Clean empty foreground ready for product placement, architectural depth, beautiful diffused natural ambient lighting, photorealistic, 8k resolution, no logos or text.`;

    let imageUrl: string | null = null;
    let modelUsed = 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: '1K',
          },
        },
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (primaryErr: any) {
      console.warn('Fallback for bg generation to gemini-3.1-flash-lite-image:', primaryErr.message);
      modelUsed = 'gemini-3.1-flash-lite-image';
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: finalPrompt }],
        },
      });

      if (fallbackResponse.candidates && fallbackResponse.candidates[0]?.content?.parts) {
        for (const part of fallbackResponse.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({ error: 'Failed to generate background image.' });
      return;
    }

    res.json({
      success: true,
      imageUrl,
      modelUsed,
      prompt,
    });
  } catch (error: any) {
    console.error('Error generating background:', error);
    res.status(500).json({ error: error.message || 'Background generation failed' });
  }
});

// 6. AI Intelligent Mockup + Background Environment Blending
app.post('/api/gemini/blend-mockup-background', async (req: Request, res: Response) => {
  try {
    const { productMockupBase64, backgroundBase64, instructions, lightingConfig } = req.body;
    if (!productMockupBase64) {
      res.status(400).json({ error: 'Missing product mockup image' });
      return;
    }

    const mockupClean = cleanBase64(productMockupBase64);
    const parts: any[] = [
      {
        inlineData: {
          data: mockupClean.data,
          mimeType: mockupClean.mimeType,
        },
      },
    ];

    if (backgroundBase64) {
      const bgClean = cleanBase64(backgroundBase64);
      parts.push({
        inlineData: {
          data: bgClean.data,
          mimeType: bgClean.mimeType,
        },
      });
    }

    let lightingDetails = '';
    if (lightingConfig) {
      const intensityLabel =
        lightingConfig.intensity > 1.3
          ? 'high-key intense direct light'
          : lightingConfig.intensity < 0.7
          ? 'subdued moody low ambient light'
          : 'natural balanced daylight';
      const moodMap: Record<string, string> = {
        'studio-daylight': 'clean 5500K balanced daylight with soft studio fill',
        'golden-hour': 'warm 3200K golden hour sunset with rich amber rim illumination and soft long cast shadows',
        'moody-twilight': 'atmospheric evening twilight with cool blue deep shadows and subtle specular highlights',
        'commercial-strobe': 'high-contrast studio strobe with razor sharp edge definition and crisp highlights',
        'vintage-film': 'warm nostalgic film grading with muted organic tones',
        'overcast-soft': 'soft diffused overcast light with even exposure and gentle ground contact shadows',
      };
      const moodDesc = moodMap[lightingConfig.mood] || 'natural illumination';
      lightingDetails = `Lighting settings: intensity ${(lightingConfig.intensity * 100).toFixed(0)}% (${intensityLabel}), mood style: ${moodDesc}, key light angle: ${lightingConfig.angleDeg}°, shadow density: ${(lightingConfig.shadowOpacity * 100).toFixed(0)}%.`;
    }

    const blendPrompt = instructions
      ? `Seamlessly composite and blend this product mockup into the background scene. ${lightingDetails} ${instructions}. Match directional lighting, subtle contact shadows, natural specular reflections, and ambient depth. Ensure apparel graphics remain perfectly crisp and legible.`
      : `Seamlessly blend this product mockup into the provided environment background. ${lightingDetails} Match the perspective, natural contact drop shadows, ambient color temperature, and lighting direction. Ultra-realistic commercial lookbook quality.`;

    parts.push({ text: blendPrompt });

    let imageUrl: string | null = null;
    let modelUsed = 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: '4:3',
            imageSize: '1K',
          },
        },
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (primaryErr: any) {
      console.warn('Fallback to gemini-3.1-flash-lite-image for blending:', primaryErr.message);
      modelUsed = 'gemini-3.1-flash-lite-image';
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts },
      });
      if (fallback.candidates && fallback.candidates[0]?.content?.parts) {
        for (const part of fallback.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({ error: 'Failed to blend mockup into background.' });
      return;
    }

    res.json({
      success: true,
      imageUrl,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error blending mockup:', error);
    res.status(500).json({ error: error.message || 'Mockup blending failed' });
  }
});

// Configure Vite or Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Atelier Merch Studio server running on port ${port}`);
  });
}

startServer();
