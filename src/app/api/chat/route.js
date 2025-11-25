// ✅ UPDATED API ROUTE - BACKEND (Question-Focused)
import { NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';

const MODELS = ["nousresearch/hermes-3-llama-3.1-70b:zsw-free"];

export async function POST(req) {
  try {
    const { message, interactiveMode } = await req.json();

    const resumePath = path.join(process.cwd(), 'public', 'resume.txt');
    let resumeData = '';

    try {
      await fs.access(resumePath);
      const fullResume = await fs.readFile(resumePath, 'utf8');

      const sections = {
        name: fullResume.match(/(?:Name|Summary|About)\s*:\s*(.*?)(?=\n[A-Z][a-z]+:|$)/is)?.[1]?.trim() || '',
        education: fullResume.match(/Education\s*:\s*(.*?)(?=\n[A-Z][a-z]+:|$)/is)?.[1]?.trim() || '',
        experience: fullResume.match(/Experience\s*:\s*(.*?)(?=\n[A-Z][a-z]+:|$)/is)?.[1]?.trim() || '',
        skills: fullResume.match(/Skills\s*:\s*(.*?)(?=\n[A-Z][a-z]+:|$)/is)?.[1]?.trim() || '',
        projects: fullResume.match(/Projects\s*:\s*(.*?)(?=\n[A-Z][a-z]+:|$)/is)?.[1]?.trim() || '',
        achievements: fullResume.match(/Achievements?\s*:\s*(.*?)$/is)?.[1]?.trim() || ''
      };

      resumeData = Object.entries(sections)
        .filter(([, content]) => content.length > 5)
        .map(([key, content]) => `**${key.toUpperCase()}**: ${content}`)
        .join('\n\n') || fullResume.slice(0, 1500);

    } catch (fileError) {
      resumeData = `**RESUME**: Shaik Rezwan Ali - B.Tech CS (AI/ML), Next.js/React/Node.js, Portfolio/E-commerce/Healthcare projects`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Rezwan Voice Bot",
      },
      body: JSON.stringify({
        model: MODELS[0],
        temperature: 0.1,
        max_tokens: interactiveMode ? 150 : 400,
        messages: [
          {
            role: "system",
            content: `You are **Shaik Rezwan Ali** - Fresher Software Engineer

**RESUME FACTS ONLY**:
${resumeData}

**🚨 STRICT QUESTION-ONLY RULE**: 
- Answer ONLY the specific question asked
- NO extra chit-chat, background stories, or unsolicited info
- If asked about experience/projects/education/background: Use EXACT intro format below
- Stick to question topic 100%

**MANDATORY INTRODUCTION FORMAT** (ONLY when directly asked about you/background/experience/projects/education/tell me about yourself):
"Hi! I'm Shaik Rezwan Ali, [NAME/EDUCATION].
Experience: [EXPERIENCE].
Skills: [SKILLS - Next.js, React, Node.js, DSA].
Projects: [PROJECTS - Portfolio, E-commerce, Healthcare].
Achievements: [ACHIEVEMENTS].
Excited to build AI solutions! Thank you!"

**RESPONSE RULES**:
1. **QUESTION-FOCUSED**: Direct answer to question only with little elaboration
2. **NO INTRODUCTION** unless specifically asked about yourself or breif or something like that
3. ${interactiveMode ? 'SHORT (50-80 words)' : 'DETAILED but question-specific'}
4. Resume facts ONLY - NO hallucinations
5. End with "Thank you!" if appropriate

**Examples**:
Q: "What’s your experience?" → Use intro format
Q: "How do you handle state?" → "In React/Next.js I use Redux/Zustand..."
Q: "Favorite framework?" → "Next.js for full-stack"`
          },
          { role: "user", content: message }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ reply: `⚠️ API Error ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "⚠️ No response.";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return NextResponse.json({ reply: "⚠️ Server error. Try again!" }, { status: 500 });
  }
}
