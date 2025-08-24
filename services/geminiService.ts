import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateImageParams, GenerateVideoParams, StructuredPromptParams } from '../types';
import { IMAGE_MODEL_OPTIONS, VIDEO_MODEL_OPTIONS } from "../constants";

const handleError = (error: unknown) => {
  console.error("Error calling Gemini API:", error);
  if (error instanceof Error) {
    if (error.message.includes('API key not valid')) {
      throw new Error('The provided API key is not valid. Please check your key and try again.');
    }
    if (error.message.toLowerCase().includes('quota')) {
      throw new Error('You have exceeded your API quota. Please check your Google AI account.');
    }
    if (error.message.toLowerCase().includes('timed out')) {
      throw new Error('The request timed out. Please try again.');
    }
    throw new Error(`API Error: ${error.message}`);
  }
  throw new Error(`An unexpected error occurred: ${String(error)}`);
};

export const generateImage = async ({ prompt, model, aspectRatio, apiKey }: GenerateImageParams): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const selectedModel = IMAGE_MODEL_OPTIONS.find(opt => opt.id === model);
    if (!selectedModel) throw new Error("Invalid image model selected.");

    const response = await ai.models.generateImages({
      model: selectedModel.modelName,
      prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio },
    });

    if (response.generatedImages?.length) {
      const b64 = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${b64}`;
    }
    throw new Error("Image generation failed: No image was returned from the API.");
  } catch (error) {
    handleError(error);
    throw error;
  }
};


export const generateVideo = async ({ prompt, model, image, apiKey }: GenerateVideoParams): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const selectedModel = VIDEO_MODEL_OPTIONS.find(opt => opt.id === model);
    if (!selectedModel) throw new Error("Invalid video model selected.");

    const videoRequest: {
      model: string;
      prompt: string;
      config: { numberOfVideos: number };
      image?: {
        imageBytes: string;
        mimeType: string;
      };
    } = {
      model: selectedModel.modelName,
      prompt,
      config: { numberOfVideos: 1 }
    };

    if (image) {
      const parts = image.split(';base64,');
      const mimeTypePart = parts[0].split(':');
      if (mimeTypePart.length < 2 || parts.length < 2) {
        throw new Error("Invalid image format for video generation.");
      }
      const mimeType = mimeTypePart[1];
      const imageBytes = parts[1];
      
      videoRequest.image = {
        imageBytes,
        mimeType
      };
    }

    let operation = await ai.models.generateVideos(videoRequest);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10_000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation.error) {
      throw new Error(`${operation.error.message || `Operation error: ${JSON.stringify(operation.error)}`}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed: No video was returned from the API.");
    }

    const resp = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!resp.ok) {
        throw new Error(`Failed to download video: ${resp.status} ${resp.statusText}`);
    }
    const videoBlob = await resp.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const generateStructuredPrompt = async ({ idea, style, camera, negatives, isJson, numberOfVariations, apiKey }: StructuredPromptParams): Promise<string[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey });

        let finalUserPrompt = '';
        let config: any = {};

        if (isJson) {
            config = {
                systemInstruction: `You are a scriptwriting assistant that generates structured video production plans in JSON format. Your task is to take a user's core idea and expand it into a detailed JSON object that follows a specific schema. This includes metadata about the video and a timeline broken down into sequences with actions and audio cues. The total duration of the video timeline must not exceed 8 seconds. Fill in all fields creatively based on the user's input.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        metadata: {
                            type: Type.OBJECT,
                            properties: {
                                prompt_name: { type: Type.STRING, description: "A concise, descriptive name for the prompt, generated based on the main video idea." },
                                main_video_idea: { type: Type.STRING, description: "The core video idea provided by the user." },
                                base_style: { type: Type.STRING, description: "The base style for the video (e.g., 'cinematic')." },
                                aspect_ratio: { type: Type.STRING, description: "The aspect ratio, fixed to '16:9'." },
                                scene_description: { type: Type.STRING, description: "A detailed description of the overall scene and environment." },
                                camera_setup: { type: Type.STRING, description: "The camera setup and movement style." },
                                starting_elements: { type: Type.STRING, description: "Description of the key elements at the beginning of the video." },
                                final_elements: { type: Type.STRING, description: "Description of the key elements at the end of the video." },
                                transformation_object: { type: Type.STRING, description: "The object or element that undergoes a transformation, if any." },
                                negative_prompts: { type: Type.STRING, description: "Elements to exclude from the video." }
                            },
                            required: ["prompt_name", "main_video_idea", "base_style", "aspect_ratio", "scene_description", "camera_setup", "starting_elements", "final_elements", "transformation_object", "negative_prompts"]
                        },
                        timeline: {
                            type: Type.ARRAY,
                            description: "A sequence of events in the video, with at least 2 entries. The total duration must not exceed 8 seconds; the final timestamp must end at or before '00:08'.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    sequence: { type: Type.STRING, description: "The sequence identifier and a brief description, formatted as '1 (Description)'." },
                                    timestamp: { type: Type.STRING, description: "The time range for this sequence (e.g., '00:00-00:02')." },
                                    action: { type: Type.STRING, description: "A detailed description of the action occurring in this sequence." },
                                    audio: { type: Type.STRING, description: "Description of the corresponding audio, sound effects, or music." }
                                },
                                required: ["sequence", "timestamp", "action", "audio"]
                            }
                        }
                    },
                    required: ["metadata", "timeline"]
                }
            };

            finalUserPrompt = `
            Based on the following inputs, generate a detailed video production plan in the required JSON format.
            - Core Idea: "${idea}"
            - Base Style: "${style}"
            - Camera & Shot: "${camera}"
            `;
            if (negatives) {
                finalUserPrompt += `\n- Exclude (Negative Prompt): "${negatives}"`;
            }
            finalUserPrompt += `
            \nYour task is to creatively expand on this core idea to fill all fields in the JSON schema.
            - For the 'metadata' object:
              - 'prompt_name', 'main_video_idea', 'scene_description', 'starting_elements', 'final_elements', 'transformation_object' should all be generated based on the core idea.
              - Use the provided values for 'base_style' and 'camera_setup'.
              - Set 'aspect_ratio' to "16:9".
              - For 'negative_prompts', use the provided value. If none is provided, you can either leave it empty or generate relevant ones based on the idea.
            - For the 'timeline' array:
              - IMPORTANT: The total video duration MUST NOT exceed 8 seconds. The final timestamp must end at or before "00:08".
              - Create at least two sequence objects.
              - Creatively describe the actions, timestamps, and audio for each sequence to tell a short story based on the core idea within the 8-second limit.
            `;
        } else {
            config = {
                systemInstruction: `You are a creative assistant specializing in crafting detailed prompts for AI video generation models like VEO. Your goal is to combine the user's ideas into a single, cohesive, and highly descriptive prompt. The prompt should be a vivid paragraph that paints a clear picture. Generate a unique variation based on the inputs provided.`
            };
            finalUserPrompt = `
            Please generate a detailed video prompt based on the following elements:
            - **Core Idea:** "${idea}"
            - **Base Style:** "${style}"
            - **Camera & Shot:** "${camera}"
            `;

            if (negatives) {
                finalUserPrompt += `\n- **Exclude (Negative Prompt):** "${negatives}"`;
            }
            finalUserPrompt += `\n\nCombine these into a single descriptive paragraph. If a negative prompt is provided, create a separate "Negative prompt:" section after the main prompt.`;
        }


        const generationPromises = Array(numberOfVariations).fill(0).map(() => 
            ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: finalUserPrompt,
                config
            })
        );
        
        const responses = await Promise.all(generationPromises);
        
        return responses.map(response => {
            if (isJson) {
                // The response.text is already a stringified JSON due to responseMimeType
                const parsedJson = JSON.parse(response.text);
                return JSON.stringify(parsedJson, null, 2);
            }
            return response.text.trim();
        });

    } catch (error) {
        handleError(error);
        throw error;
    }
};