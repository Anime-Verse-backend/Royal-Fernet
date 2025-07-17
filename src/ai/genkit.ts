/**
 * @fileoverview Archivo de inicialización y configuración central para Genkit.
 * Aquí se configura el plugin de Google AI y se define el modelo de lenguaje
 * por defecto que se utilizará en los flujos de la aplicación.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
