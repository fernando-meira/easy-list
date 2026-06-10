import Anthropic from '@anthropic-ai/sdk';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { getUserHistoryForAI } from '@/lib/firestore-domain';

const client = new Anthropic();

function buildSystemPrompt(history: { name: string; products: string[] }[]): string {
  const base = `Você é um assistente de lista de compras.
Responda APENAS com JSON válido, sem texto adicional, no formato:
{ "categoryName": string, "products": [{ "name": string }] }

Gere entre 8 e 15 produtos por padrão, adequados ao contexto do pedido.
Os nomes devem estar em português do Brasil.`;

  if (history.length === 0) return base;

  const lines = history.map((c) => `- ${c.name}: ${c.products.join(', ')}`).join('\n');

  return `${base}

Histórico de compras do usuário:
${lines}

Use esse histórico como referência de preferências, mas adapte ao pedido atual.`;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<{ categoryName: string; products: { name: string }[] }> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  return JSON.parse(text);
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: authSecret });
    const userId = token?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const prompt: string = body?.prompt;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const history = await getUserHistoryForAI(userId);
    const systemPrompt = buildSystemPrompt(history);

    let result: { categoryName: string; products: { name: string }[] };

    try {
      result = await callClaude(systemPrompt, prompt);
    } catch {
      result = await callClaude(systemPrompt, prompt);
    }

    if (!result.categoryName) {
      result.categoryName = prompt.slice(0, 50);
    }

    if (!result.products || result.products.length === 0) {
      return NextResponse.json(
        { error: 'A IA não conseguiu gerar produtos para este pedido.' },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao gerar lista com IA' }, { status: 500 });
  }
}
