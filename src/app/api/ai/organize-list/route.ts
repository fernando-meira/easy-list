import { getToken } from 'next-auth/jwt';
import Anthropic from '@anthropic-ai/sdk';
import { authSecret } from '@/lib/auth-secret';
import { NextRequest, NextResponse } from 'next/server';
import { organizeList, OrganizeProduct, getProductsForOrganize } from '@/lib/firestore-domain';

const client = new Anthropic();

type ClaudeOrganizeResponse = {
  products: OrganizeProduct[];
  subcategoryOrder: string[];
};

const SYSTEM_PROMPT = `Classifique cada produto em uma subcategoria.
Retorne APENAS JSON válido, sem texto adicional:
{
  "subcategoryOrder": string[],
  "products": [{ "id": string, "subcategory": string }]
}

Nomes canônicos em PT-BR para listas de supermercado:
"Frutas e Verduras", "Laticínios", "Carnes e Aves", "Padaria",
"Mercearia", "Congelados", "Bebidas", "Limpeza", "Higiene e Beleza"

Regras:
- Mapeie variações para o canônico mais próximo (ex: "Proteínas" → "Carnes e Aves")
- Crie novas subcategorias para listas fora do domínio supermercado
- Todo produto deve ter uma subcategoria
- subcategoryOrder deve refletir ordem lógica de percurso no supermercado ou contexto equivalente`;

async function callClaude(products: { id: string; name: string }[]): Promise<ClaudeOrganizeResponse> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(products) }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

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
    const categoryId: string = body?.categoryId;

    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json({ error: 'categoryId é obrigatório' }, { status: 400 });
    }

    const products = await getProductsForOrganize(userId, categoryId);

    if (!products) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    if (products.length < 2) {
      return NextResponse.json({ error: 'São necessários pelo menos 2 produtos' }, { status: 400 });
    }

    const result = await callClaude(products);

    const success = await organizeList(userId, categoryId, result.subcategoryOrder, result.products);

    if (!success) {
      return NextResponse.json({ error: 'Erro ao salvar organização' }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao organizar lista' }, { status: 500 });
  }
}
