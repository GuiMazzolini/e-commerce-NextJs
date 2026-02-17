'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center" >
            <Link href="/" className="text-xl font-bold text-gray-900">
                MyStore
            </Link>
            <ul className="flex space-x-4">
                <li>
                    <Link 
                        href="/products" 
                        className={`text-gray-700 hover:text-black ${pathname === '/products' ? 'font-bold' : ''}`}
                    > 
                        Products 
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/cart" 
                        className={`text-gray-700 hover:text-black ${pathname === '/cart' ? 'font-bold' : ''}`}
                    > 
                        Cart 
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/checkout" 
                        className={`text-gray-700 hover:text-black ${pathname === '/checkout' ? 'font-bold' : ''}`}
                    > 
                        Checkout 
                    </Link>
                </li>
            </ul>
        </div>
    </nav>
  )
};