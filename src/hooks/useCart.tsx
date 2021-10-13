import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
  const storagedCart = localStorage.getItem('RocketShoes:cart')

   if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const product = updatedCart.find(obj => obj.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = product? product.amount : 0;
      const amount = currentAmount+1;
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
    if(product) {
      product.amount = amount;
    }else{
    const thisProduct = await api.get(`/products/${productId}`);
    const newProduct ={
      ...thisProduct.data,
      amount: 1
    }
    updatedCart.push(newProduct);
  }
    setCart(updatedCart);
    localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart))
        
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const products = [...cart];
      const productIndex = products.findIndex(obj => obj.id === productId)
      
      
      if(productIndex >= 0){
        products.splice(productIndex, 1);
        setCart(products)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(products));
      }
      else{
        throw Error();
      }
     }catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount >= 1){
        const products = [...cart];
        const product = products.find(obj => obj.id === productId);
        if(product){
          const stock = await api.get(`/stock/${productId}`);
          if(stock && stock.data.amount >= amount){
            product.amount = amount;
            setCart(products);
          localStorage.setItem('@RocketShoes:cart',JSON.stringify(products));
        }else{
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

    }else{
      throw Error();;
    }
      }else{
        return;
      }  
  } catch {
    toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
