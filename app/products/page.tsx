import ProductsList from "../ProductsList"
import { products } from "../product-data"

const ProductsPage = () => {
  return (
    <>
        <h1>Products</h1>
        <ProductsList products={products} />
    </>
  )
}

export default ProductsPage