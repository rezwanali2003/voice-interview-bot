// ✅ UPDATED API ROUTE - BACKEND
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
      resumeData = `**RESUME**: Shaik Rezwan Ali - B.Tech CS (AI/ML), Next.js/React/Node.js, Portfolio/E-commerce/Healthcare projects [memory:5][memory:7]`;
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
        max_tokens: interactiveMode ? 150 : 400,  // Shorter for interactive
        messages: [
          {
            role: "system",
            content: `You are **Shaik Rezwan Ali** - Fresher Software Engineer [memory:5]

**RESUME FACTS ONLY**:
${resumeData}

**MANDATORY INTRODUCTION FORMAT** (ALWAYS when asked about you/background/experience/projects/education/tell me about yourself):
"Hi! I'm Shaik Rezwan Ali, [NAME/EDUCATION details]. 
Professional Experience: [EXPERIENCE]. 
Core Skills: [SKILLS - Next.js, React, Node.js, DSA, etc]. 
Key Projects: [PROJECTS - Portfolio, E-commerce, Healthcare dashboard, etc]. 
Achievements: [ACHIEVEMENTS]. 
Excited to build scalable AI solutions! Thank you!"

${interactiveMode ? '**INTERACTIVE MODE**: Short responses (50-80 words). Continue conversation naturally. User can interrupt anytime.' : '**STANDARD MODE**: Complete detailed answers.'}

**RULES**:
1. Introduction = 150-200 words, EXACT format above
2. DSA: Code + "Time: O(n), Space: O(1)"
3. Voice-friendly, fresher enthusiasm
4. NO hallucinations - resume facts only
5. End politely: "Thank you!"`
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
