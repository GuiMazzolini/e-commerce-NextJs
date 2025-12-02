import { Product } from "./product-data";
import Image from "next/image";
import Link from "next/link";

const ProductsList = ({ products } : { products: Product[] }) => {
  return (
    <div>
        {products.map(product => (
            <Link key={product.id} href="/product-detail">
                <Image src={"/" + product.imageUrl} alt="Product Imagew" width={150} height={150}/>
                <h2>{product.name}</h2>
                <p>${product.price}</p>
            </Link>
        ))}
    </div>
  )
}

export default ProductsList