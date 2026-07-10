import { getProducts } from "@/lib/data";
import { ProductsView } from "@/components/admin/products-view";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsView products={products} />;
}
