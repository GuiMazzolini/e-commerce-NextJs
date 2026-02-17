import ProductsList from '../ProductsList';

export default async function ProductsPage() {
  const response = await fetch('http://localhost:3000/api/products');
  const products = await response.json();

  const response2 = await fetch('http://localhost:3000/api/users/2/cart/', {cache: 'no-cache'});
  const cartProducts = await response2.json();


  return (
    <>
      <ProductsList products={products} initialCartProducts={cartProducts}/>
    </>
  );
}
