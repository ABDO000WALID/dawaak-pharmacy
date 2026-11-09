import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: { productId: string; quantity: number }[] = body.items || [];

    let subtotalEgp = 0;
    let hasPrescriptionItems = false;
    const prescriptionWarnings: { productId: string; productNameAr: string; messageAr: string }[] = [];
    const stockWarnings: { productId: string; messageAr: string }[] = [];

    for (const item of items) {
      const product = ProductService.getProductById(item.productId);
      if (!product) continue;

      const unitPrice = product.salePriceEgp ?? product.priceEgp;
      subtotalEgp += unitPrice * Math.min(product.maxOrderQuantity || 5, item.quantity);

      if (product.prescriptionRequired) {
        hasPrescriptionItems = true;
        prescriptionWarnings.push({
          productId: product.id,
          productNameAr: product.nameAr,
          messageAr: `المستحضر (${product.nameAr}) يتطلب روشتة طبية سارية من طبيب مرخص قبل التوصيل`,
        });
      }

      if (item.quantity > (product.maxOrderQuantity || 5)) {
        stockWarnings.push({
          productId: product.id,
          messageAr: `تم تعديل كمية (${product.nameAr}) إلى 5 عبوات كحد أقصى لمنع الاحتكار`,
        });
      }
    }

    const deliveryFeeEgp = subtotalEgp >= 300 || subtotalEgp === 0 ? 0 : 25;
    const totalEgp = subtotalEgp + deliveryFeeEgp;

    return NextResponse.json({
      success: true,
      isValid: true,
      subtotalEgp,
      deliveryFeeEgp,
      totalEgp,
      hasPrescriptionItems,
      prescriptionWarnings,
      stockWarnings,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Validation failed' },
      { status: 400 }
    );
  }
}
