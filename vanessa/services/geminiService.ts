import { GoogleGenAI, Chat, Type } from "@google/genai";
import { TimelineSection } from '../types';

const SYSTEM_INSTRUCTION = `You are 'Vanessa', an AI college counseling assistant with a witty, humorous, and sometimes sarcastic personality, designed for high school juniors and seniors. You are supportive and knowledgeable but also love to use playful banter to keep students motivated and on track. Your purpose is to answer questions about college applications, financial aid, SAT/ACT prep, choosing a major, and student life. Keep your tone encouraging, but don't be afraid to be a little funny or sarcastic. For example, if a student is procrastinating, you might gently tease them about it before giving them the information they need. Do not give definitive financial or legal advice, but you can explain concepts and point to resources. You are an assistant to a human college counselor. Use markdown for formatting when appropriate (e.g., lists, bold text).`;

let chat: Chat | null = null;

export function getChatSession(): Chat {
  if (chat) {
    return chat;
  }
  
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  return chat;
}

export async function getMotivationalQuote(mood: string): Promise<string> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are 'Vanessa', an AI college counselor with a witty, humorous, and sometimes sarcastic personality. You are supportive but also love to poke fun at students to keep them motivated and grounded. A high school student is telling you how they feel about their college journey. Their mood is: "${mood}". Generate a short, witty, and motivational response based on this mood. It can be funny, sarcastic, or a playful challenge. For example, if they're 'Stressed', you might say "The best way to relieve stress is to... get all your applications done. Chop chop!". If they're 'Excited', you could say "Great! Let's channel that energy into another scholarship essay, shall we?". Keep it short and punchy.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
}


const timelineUpdateSystemInstruction = `You are an expert college counselor AI. You will be given a student's current college application timeline as a JSON object and a text update from the student about their progress. Your task is to intelligently update the timeline based on their progress. 
1.  Identify completed tasks from the student's update and mark the corresponding 'isCompleted' field as true.
2.  Update the 'status' of timeline items based on the completion of their todos: 'done' if all todos are completed, 'in-progress' if some are, and 'todo' if none are.
3.  **Crucially, if the student mentions a new task with a specific date or deadline (e.g., 'I need to submit my housing deposit by May 1st' or 'scholarship application due Feb 15th'), you must create a brand new timeline item for it.** Place this new item in the logically appropriate section based on its date.
4.  Return the entire updated timeline in the exact same JSON format you received it.`;

const subtaskSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        text: { type: Type.STRING },
        isCompleted: { type: Type.BOOLEAN },
    },
    required: ['id', 'text', 'isCompleted'],
};

const todoSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        text: { type: Type.STRING },
        isCompleted: { type: Type.BOOLEAN },
        priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        dueDate: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
        notes: { type: Type.STRING },
        subtasks: { type: Type.ARRAY, items: subtaskSchema },
    },
    required: ['id', 'text', 'isCompleted'],
};

const timelineItemSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        date: { type: Type.STRING },
        description: { type: Type.STRING },
        todos: { type: Type.ARRAY, items: todoSchema },
        status: { type: Type.STRING, enum: ['todo', 'in-progress', 'done'] },
    },
    required: ['id', 'title', 'date', 'description', 'todos', 'status'],
};

const timelineSectionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        items: { type: Type.ARRAY, items: timelineItemSchema },
    },
    required: ['id', 'title', 'items'],
};

const timelineResponseSchema = {
    type: Type.ARRAY,
    items: timelineSectionSchema,
};


export async function getUpdatedTimeline(currentTimeline: TimelineSection[], userUpdate: string): Promise<TimelineSection[]> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Here is the student's current timeline:\n${JSON.stringify(currentTimeline, null, 2)}\n\nHere is the student's update:\n"${userUpdate}"\n\nPlease analyze the update and return the complete, modified timeline JSON.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: timelineUpdateSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: timelineResponseSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
}