// Test simple del chat para simular usuario
const testMessages = [
  { role: 'user', content: 'hola, ¿cómo estás?' },
  { role: 'assistant', content: '¡Hola! Soy un asistente de IA. ¿En qué te puedo ayudar hoy?' },
  { role: 'user', content: 'saludos' },
];

console.log('✅ Test chat messages created');
console.log('Messages:', testMessages);
console.log('');
console.log('Para probar el chat:');
console.log('1. Abre http://localhost:3000 en tu navegador');
console.log('2. Haz clic en "New Chat"');
console.log('3. Escribe: "saludos"');
console.log('4. El asistente debería responder en español');
console.log('');
console.log('Si ves un error 401, es porque:');
console.log('- ANTHROPIC_API_KEY está vacía en .env.local');
console.log('- Las claves de API no están configuradas');
console.log('');
console.log('Para configurar las API keys:');
console.log('1. Edita .env.local');
console.log('2. Agrega tu API key de Anthropic: ANTHROPIC_API_KEY=sk-ant-xxx...');
console.log('3. Agrega tu API key de DeepSeek (opcional): DEEPSEEK_API_KEY=sk-xxx...');
console.log('4. Agrega tu API key de Z.ai (opcional): ZAI_API_KEY=xxx...');
