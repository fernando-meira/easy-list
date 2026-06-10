import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';

type RouteContext = {
  params: Promise<{ code: string }>;
};

type OpenFoodFactsResponse = {
  code?: string;
  status?: number;
  product?: {
    brands?: string;
    image_url?: string;
    product_name?: string;
  };
};

const BARCODE_PATTERN = /^[0-9A-Za-z-]{4,32}$/;
const LOOKUP_TIMEOUT_MS = 7000;

async function getUserId(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });

  return token?.sub ?? null;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { code } = await context.params;
    const barcode = decodeURIComponent(code).trim();

    if (!BARCODE_PATTERN.test(barcode)) {
      return NextResponse.json({ error: 'Código de barras inválido' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({
        fields: 'code,product_name,brands,image_url',
      });
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?${params}`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'easy-list/0.1.0 (barcode lookup)',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Não foi possível consultar o produto' },
          { status: 502 }
        );
      }

      const data = await response.json() as OpenFoodFactsResponse;

      if (data.status !== 1 || !data.product) {
        return NextResponse.json({ barcode, found: false });
      }

      const name = normalizeString(data.product.product_name);

      if (!name) {
        return NextResponse.json({ barcode, found: false });
      }

      return NextResponse.json({
        barcode,
        found: true,
        name,
        brand: normalizeString(data.product.brands),
        imageUrl: normalizeString(data.product.image_url),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Tempo esgotado ao consultar o produto' },
        { status: 504 }
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: 'Erro ao consultar código de barras' },
      { status: 500 }
    );
  }
}
