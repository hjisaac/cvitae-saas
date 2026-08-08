export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  isStatus?: boolean; // Used to show "Tailoring CV..." intermediate states
};

export type AITailorResponse = {
  reply: string;
  updatedYaml?: string;
};

/**
 * Mock API call to the AI Tailor endpoint.
 * In a real app, this would be a fetch() call to /api/ai-tailor
 */
export async function sendAITailorRequest(
  prompt: string,
  currentYaml: string,
  model: string
): Promise<AITailorResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Dummy logic: We just return a nice message and slightly tweak the YAML as proof of concept.
  const isCodeRequest = prompt.toLowerCase().includes("code") || prompt.toLowerCase().includes("yaml");
  
  let updatedYaml = currentYaml;
  
  if (currentYaml && currentYaml.trim().length > 0) {
    // Just inject a dummy comment at the top to prove the update loop works
    updatedYaml = `# AI Tailored on ${new Date().toLocaleTimeString()} based on: "${prompt}"\n${currentYaml}`;
  }

  return {
    reply: `I've applied your request ("${prompt}") using ${model}. The YAML editor has been updated!`,
    updatedYaml,
  };
}
