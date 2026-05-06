import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function listAllModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("ERROR: GEMINI_API_KEY is missing from .env");
    return;
  }
  console.log("Checking all models for key ending in:", key.slice(-4));
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    console.log("--- MODELS YOU CAN USE ---");
    if (res.data.models && res.data.models.length > 0) {
      res.data.models.forEach(m => console.log("- " + m.name));
    } else {
      console.log("NO MODELS FOUND! Your API key has 0 models enabled.");
    }
  } catch (e) {
    const errorMsg = e.response?.data?.error?.message || e.message;
    console.log("FAILED! Error:", errorMsg);
    if (errorMsg.includes("API key not valid")) {
      console.log("SOLUTION: Your API key is invalid. Please create a new one in AI Studio.");
    }
  }
}
listAllModels();
