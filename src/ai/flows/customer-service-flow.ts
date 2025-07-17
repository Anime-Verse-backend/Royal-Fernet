'use server';
/**
 * @fileOverview Un agente de IA para el servicio de atención al cliente.
 *
 * - customerService - Una función que maneja las consultas de los clientes.
 * - CustomerServiceInput - El tipo de entrada para la función.
 * - CustomerServiceOutput - El tipo de retorno para la función.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomerServiceInputSchema = z.string().describe('The user query to the customer service bot.');
export type CustomerServiceInput = z.infer<typeof CustomerServiceInputSchema>;

const CustomerServiceOutputSchema = z.string().describe('The response from the customer service bot.');
export type CustomerServiceOutput = z.infer<typeof CustomerServiceOutputSchema>;

export async function customerService(input: CustomerServiceInput): Promise<CustomerServiceOutput> {
  return customerServiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerServicePrompt',
  input: {schema: CustomerServiceInputSchema},
  output: {schema: CustomerServiceOutputSchema},
  prompt: `You are a friendly and helpful customer service assistant for Royal-Fernet, a luxury watch store.

Your goal is to assist users with their questions about products, orders, and shipping. Be concise and professional.

User question: {{{prompt}}}`, 
});

const customerServiceFlow = ai.defineFlow(
  {
    name: 'customerServiceFlow',
    inputSchema: CustomerServiceInputSchema,
    outputSchema: CustomerServiceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
