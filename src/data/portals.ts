export type Portal = {
  name: string;
  careersUrl: string;
  api?: string;
  scanMethod: "greenhouse_api" | "playwright" | "websearch";
  notes?: string;
  category: string;
  enabled: boolean;
};

export const PORTALS: Portal[] = [
  // AI Labs & LLM providers
  { name: "Anthropic", careersUrl: "https://job-boards.greenhouse.io/anthropic", api: "https://boards-api.greenhouse.io/v1/boards/anthropic/jobs", scanMethod: "greenhouse_api", category: "AI Labs", enabled: true },
  { name: "OpenAI", careersUrl: "https://openai.com/careers", scanMethod: "websearch", notes: "GPT-4, GPT-5 builder", category: "AI Labs", enabled: true },
  { name: "Mistral AI", careersUrl: "https://mistral.ai/careers", scanMethod: "websearch", notes: "Paris. Open-weight LLMs", category: "AI Labs", enabled: true },
  { name: "Cohere", careersUrl: "https://cohere.com/careers", scanMethod: "websearch", notes: "Enterprise LLMs", category: "AI Labs", enabled: true },

  // Voice AI & Conversational AI
  { name: "PolyAI", careersUrl: "https://job-boards.eu.greenhouse.io/polyai", api: "https://boards-api.greenhouse.io/v1/boards/polyai/jobs", scanMethod: "greenhouse_api", notes: "UK. Voice AI for enterprise contact centers", category: "Voice AI", enabled: true },
  { name: "Parloa", careersUrl: "https://job-boards.eu.greenhouse.io/parloa", api: "https://boards-api.greenhouse.io/v1/boards/parloa/jobs", scanMethod: "greenhouse_api", notes: "Berlin. Voice AI enterprise", category: "Voice AI", enabled: true },
  { name: "Hume AI", careersUrl: "https://job-boards.greenhouse.io/humeai", api: "https://boards-api.greenhouse.io/v1/boards/humeai/jobs", scanMethod: "greenhouse_api", notes: "NYC. Empathic voice AI", category: "Voice AI", enabled: true },
  { name: "ElevenLabs", careersUrl: "https://jobs.ashbyhq.com/elevenlabs", scanMethod: "websearch", notes: "Voice AI TTS leader", category: "Voice AI", enabled: true },
  { name: "Deepgram", careersUrl: "https://jobs.ashbyhq.com/deepgram", scanMethod: "websearch", notes: "STT/TTS APIs", category: "Voice AI", enabled: true },
  { name: "Vapi", careersUrl: "https://jobs.ashbyhq.com/vapi", scanMethod: "websearch", notes: "Voice AI infrastructure", category: "Voice AI", enabled: true },
  { name: "Bland AI", careersUrl: "https://jobs.ashbyhq.com/bland", scanMethod: "websearch", notes: "Voice phone agents. $65M Series B", category: "Voice AI", enabled: true },

  // AI-native platforms (FDE/SA teams)
  { name: "Retool", careersUrl: "https://retool.com/careers", scanMethod: "websearch", notes: "London. Popularized Deployed Engineer role", category: "AI Platforms", enabled: true },
  { name: "Airtable", careersUrl: "https://job-boards.greenhouse.io/airtable", api: "https://boards-api.greenhouse.io/v1/boards/airtable/jobs", scanMethod: "greenhouse_api", notes: "No-code + AI platform", category: "AI Platforms", enabled: true },
  { name: "Vercel", careersUrl: "https://job-boards.greenhouse.io/vercel", api: "https://boards-api.greenhouse.io/v1/boards/vercel/jobs", scanMethod: "greenhouse_api", notes: "AI SDK, v0.dev. Frontend AI tooling", category: "AI Platforms", enabled: true },
  { name: "Temporal", careersUrl: "https://job-boards.greenhouse.io/temporal", api: "https://boards-api.greenhouse.io/v1/boards/temporal/jobs", scanMethod: "greenhouse_api", notes: "Workflow orchestration", category: "AI Platforms", enabled: true },
  { name: "Arize AI", careersUrl: "https://job-boards.greenhouse.io/arizeai", api: "https://boards-api.greenhouse.io/v1/boards/arizeai/jobs", scanMethod: "greenhouse_api", notes: "LLMOps / AI observability", category: "LLMOps", enabled: true },
  { name: "Glean", careersUrl: "https://job-boards.greenhouse.io/gleanwork", api: "https://boards-api.greenhouse.io/v1/boards/gleanwork/jobs", scanMethod: "greenhouse_api", notes: "Enterprise AI search", category: "AI Platforms", enabled: true },
  { name: "RunPod", careersUrl: "https://job-boards.greenhouse.io/runpod", api: "https://boards-api.greenhouse.io/v1/boards/runpod/jobs", scanMethod: "greenhouse_api", notes: "GPU cloud for AI", category: "AI Infra", enabled: true },
  { name: "Langfuse", careersUrl: "https://langfuse.com/careers", scanMethod: "websearch", notes: "Berlin. LLMOps / observability", category: "LLMOps", enabled: true },
  { name: "Pinecone", careersUrl: "https://www.pinecone.io/careers", scanMethod: "websearch", notes: "Vector database", category: "AI Infra", enabled: true },

  // Contact Center AI & CX
  { name: "Intercom", careersUrl: "https://job-boards.greenhouse.io/intercom", api: "https://boards-api.greenhouse.io/v1/boards/intercom/jobs", scanMethod: "greenhouse_api", notes: "Dublin EMEA. Fin AI agent", category: "CX AI", enabled: true },
  { name: "Ada", careersUrl: "https://job-boards.greenhouse.io/ada", scanMethod: "websearch", notes: "Toronto + remote. AI customer service", category: "CX AI", enabled: true },
  { name: "LivePerson", careersUrl: "https://liveperson.com/company/careers", scanMethod: "websearch", notes: "Remote EMEA. Conversational AI enterprise", category: "CX AI", enabled: true },
  { name: "Sierra", careersUrl: "https://jobs.ashbyhq.com/sierra", scanMethod: "websearch", notes: "Bret Taylor. AI customer agents", category: "CX AI", enabled: true },
  { name: "Decagon", careersUrl: "https://jobs.ashbyhq.com/decagon", scanMethod: "websearch", notes: "AI customer support agents", category: "CX AI", enabled: true },

  // Enterprise comms & contact center
  { name: "Talkdesk", careersUrl: "https://www.talkdesk.com/careers", scanMethod: "websearch", notes: "Lisbon. Contact center AI. EMEA friendly", category: "CX AI", enabled: true },
  { name: "Twilio", careersUrl: "https://www.twilio.com/en-us/company/jobs", scanMethod: "websearch", notes: "Voice/messaging infrastructure", category: "Comms", enabled: true },
  { name: "Dialpad", careersUrl: "https://www.dialpad.com/careers", scanMethod: "websearch", notes: "Voice AI for business comms", category: "Comms", enabled: true },
  { name: "Gong", careersUrl: "https://www.gong.io/careers", scanMethod: "websearch", notes: "Revenue intelligence with voice AI", category: "Sales AI", enabled: true },
  { name: "Genesys", careersUrl: "https://www.genesys.com/careers", scanMethod: "websearch", notes: "Contact center cloud + AI", category: "CX AI", enabled: true },
  { name: "Salesforce", careersUrl: "https://careers.salesforce.com", scanMethod: "websearch", notes: "Agentforce = AI agents platform", category: "Enterprise", enabled: true },

  // Automation & No-Code
  { name: "n8n", careersUrl: "https://n8n.io/careers", scanMethod: "websearch", notes: "Berlin. Workflow automation", category: "Automation", enabled: true },
  { name: "Make", careersUrl: "https://www.make.com/en/careers", scanMethod: "websearch", notes: "No-code automation (formerly Integromat)", category: "Automation", enabled: true },
  { name: "Zapier", careersUrl: "https://zapier.com/jobs", scanMethod: "websearch", notes: "No-code automation leader", category: "Automation", enabled: true },

  // Developer Tools
  { name: "LangChain", careersUrl: "https://www.langchain.com/careers", scanMethod: "websearch", notes: "LLM framework", category: "Dev Tools", enabled: true },
  { name: "Lindy", careersUrl: "https://jobs.ashbyhq.com/lindy", scanMethod: "websearch", notes: "AI personal assistant platform", category: "AI Platforms", enabled: true },
  { name: "Attio", careersUrl: "https://attio.com/careers", scanMethod: "websearch", notes: "AI-native CRM", category: "Sales AI", enabled: true },
  { name: "Factorial", careersUrl: "https://factorialhr.com/careers", scanMethod: "websearch", notes: "Barcelona. HR software unicorn. EMEA", category: "HR Tech", enabled: true },
];

export const TITLE_FILTERS = {
  positive: [
    "AI", "ML", "LLM", "Agent", "Agentic", "GenAI",
    "Platform Engineer", "Solutions Architect", "Solutions Engineer",
    "Forward Deployed", "Customer Engineer", "Integration Engineer",
    "Product Manager", "Technical PM", "Automation", "No-Code", "Low-Code",
    "GTM Engineer", "RevOps", "Voice AI", "Conversational AI",
  ],
  negative: [
    "Junior", "Intern", ".NET", "iOS", "Android", "PHP", "Ruby",
    "Embedded", "Blockchain", "Web3", "Crypto", "SAP ", "COBOL",
  ],
};
