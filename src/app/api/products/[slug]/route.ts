import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;
    const product = ProductService.getProductBySlug(slugOrId) || ProductService.getProductById(slugOrId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
