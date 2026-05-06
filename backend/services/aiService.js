import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString('base64'),
      mimeType,
    },
  };
}

export const analyzeSkinScan = async (imagePath) => {
  try {
    // Lite mode for images
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
    const prompt = `You are a medical AI assistant specializing in dermatology. 
    Analyze this skin scan image. Provide a JSON response with:
    { "label": "...", "confidence": "...", "action": "...", "explanation": "..." }
    Return ONLY the JSON.`;

    const imageParts = [fileToGenerativePart(imagePath, 'image/jpeg')];
    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse response" };
  } catch (error) {
    console.error('Gemini Lite Skin Error:', error);
    throw error;
  }
};

export const generateTriage = async (messages, patientProfile) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
    const prompt = `Based on these symptoms, perform triage. Return JSON: { "tier": 1|2|3, "label": "...", "topSymptoms": [], "explanation": "..." }`;
    const chatHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = await model.generateContent([prompt, chatHistory]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse triage" };
  } catch (error) {
    console.error('Triage AI Lite Error:', error);
    throw error;
  }
};

export const analyzeCoughAudio = async (audioPath) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
    const prompt = `Analyze this cough audio. Return JSON: { "type": "...", "severity": "...", "detail": "..." }`;
    const audioParts = [fileToGenerativePart(audioPath, 'audio/webm')];
    const result = await model.generateContent([prompt, ...audioParts]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse audio" };
  } catch (error) {
    console.error('Audio AI Lite Error:', error);
    throw error;
  }
};
