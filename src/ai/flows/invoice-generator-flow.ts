'use server';
/**
 * @fileOverview Un generador de facturas mediante IA.
 *
 * - generateInvoice - Una función que genera una factura en formato HTML.
 * - GenerateInvoiceInput - El tipo de entrada para la función.
 * - GenerateInvoiceOutput - El tipo de retorno para la función.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInvoiceInputSchema = z.object({
  customerName: z.string().describe('El nombre del cliente.'),
  productName: z.string().describe('El nombre del producto comprado.'),
  quantity: z.number().describe('La cantidad de productos comprados.'),
  price: z.number().describe('El precio unitario del producto.'),
  invoiceNumber: z.string().describe('El número de factura único.'),
  date: z.string().describe('La fecha de la factura (YYYY-MM-DD).'),
});
export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceInputSchema>;

const GenerateInvoiceOutputSchema = z.object({
    invoiceHtml: z.string().describe('La factura completa en formato HTML.'),
});
export type GenerateInvoiceOutput = z.infer<typeof GenerateInvoiceOutputSchema>;


export async function generateInvoice(input: GenerateInvoiceInput): Promise<GenerateInvoiceOutput> {
  return invoiceGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'invoiceGeneratorPrompt',
  input: {schema: GenerateInvoiceInputSchema},
  output: {schema: GenerateInvoiceOutputSchema},
  prompt: `
    You are an expert invoice designer. Create a professional and clean HTML invoice based on the following details.
    The design should be modern, using inline CSS for styling. Do not include any javascript or external stylesheets.
    The total should be calculated as quantity * price. The currency is USD.

    Details:
    - Customer Name: {{{customerName}}}
    - Product: {{{productName}}}
    - Quantity: {{{quantity}}}
    - Unit Price: \${{{price}}}
    - Invoice Number: {{{invoiceNumber}}}
    - Date: {{{date}}}

    Generate the complete HTML for the invoice.
  `,
});

const invoiceGeneratorFlow = ai.defineFlow(
  {
    name: 'invoiceGeneratorFlow',
    inputSchema: GenerateInvoiceInputSchema,
    outputSchema: GenerateInvoiceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
