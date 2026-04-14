
import { roomAssistantFlow } from '../src/ai/flows/room-assistant';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function verify() {
  const tests = [
    { name: 'Personalized Greeting', q: 'Hlo ai', user: 'Rahul' },
    { name: 'Direct Question', q: 'App mein 10 min mic ke kitne coins milte hain?', user: 'Priya' },
    { name: 'Date Check', q: 'Aaj kya date hai?', user: 'Amit' }
  ];

  for (const test of tests) {
    console.log(`--- Testing: \${test.name} (\${test.user}) ---`);
    try {
      const response = await roomAssistantFlow({
        userMessage: test.q,
        userName: test.user,
        currentTime: new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'full',
          timeStyle: 'medium',
        }).format(new Date())
      });
      console.log('Q:', test.q);
      console.log('A:', response);
    } catch (e: any) {
      console.error('FAILED:', e.message);
    }
    console.log('----------------------------\n');
  }
}

verify();
