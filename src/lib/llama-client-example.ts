/**
 * @fileoverview Example of how to call the runLlamaTool server action from client-side code.
 */
import { runLlamaToolAction } from '@/app/actions';

async function testLlamaTool() {
  console.log('Running Llama tool example...');

  // Note: For this to work, you must set LLAMA_BASE_URL and LLAMA_API_KEY in your .env file.
  
  const toolName = 'exampleTool';
  const payload = {
    query: 'What is the capital of France?',
    context: 'Some additional context here.',
  };

  // This would typically be called inside a React component, e.g., in an event handler.
  const response = await runLlamaToolAction({ toolName, payload });

  if (response.success && response.data) {
    console.log('Llama tool ran successfully!');
    console.log('Result:', response.data.result);
    if (response.data.warnings && response.data.warnings.length > 0) {
      console.log('Warnings:', response.data.warnings);
    }
  } else {
    console.error('Failed to run Llama tool.');
    console.error('Error:', response.error);
  }
}

// To run this test, you could import and call testLlamaTool() from a client component,
// for example, inside a useEffect hook or a button's onClick handler.
/*
  // In a React component:
  import { Button } from '@/components/ui/button';

  function LlamaTestButton() {
    return (
      <Button onClick={testLlamaTool}>
        Test Llama Tool
      </Button>
    )
  }
*/
