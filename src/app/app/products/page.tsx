import { getProducts } from "@/lib/data";
import { ProductsAppView } from "@/components/mobile/products-view";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsAppView products={products} />;
}
