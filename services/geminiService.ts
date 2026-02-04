
import { GoogleGenAI } from "@google/genai";
import { ConsumptionItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFunSummary = async (items: ConsumptionItem[]): Promise<string> => {
  const activeItems = items.filter(i => i.count > 0);
  if (activeItems.length === 0) return "Parece que você ainda não começou a festa!";

  const summaryData = activeItems.map(i => `${i.count}x ${i.name}`).join(', ');
  const totalPrice = activeItems.reduce((acc, i) => acc + (i.count * i.price), 0);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um resumo curto e muito divertido (estilo brincalhão e encorajador) para o consumo de um usuário em um bar/restaurante. 
      O consumo foi: ${summaryData}. 
      O total da conta foi: R$ ${totalPrice.toFixed(2)}.
      Mantenha em português do Brasil. Seja criativo, como se fosse um garçom amigo ou o mascote do Duolingo dando um feedback engraçado.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text || "Uau, que noite incrível! Você realmente aproveitou!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Você consumiu ${summaryData} por um total de R$ ${totalPrice.toFixed(2)}. Continue aproveitando com responsabilidade!`;
  }
};
