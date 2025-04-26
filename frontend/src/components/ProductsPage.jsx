import React from 'react';

const ProductsPage = () => {
  // Sample product data
  const products = [
    {
      id: 1,
      name: 'Fresh Apples',
      price: 2.99,
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      category: 'Fruits'
    },
    {
      id: 2,
      name: 'Organic Bananas',
      price: 1.99,
      image: 'https://images.unsplash.com/photo-1543218024-57a70143c369?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      category: 'Fruits'
    },
    {
      id: 3,
      name: 'Whole Milk',
      price: 3.49,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      category: 'Dairy'
    },
    {
      id: 4,
      name: 'Fresh Bread',
      price: 2.49,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      category: 'Bakery'
    },
    {
      id: 5,
      name: 'Chicken Breast',
      price: 5.99,
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      category: 'Meat'
    },
    {
      id: 6,
      name: 'Fresh Tomatoes',
      price: 1.49,
      image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      category: 'Vegetables'
    }
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Our Products</h1>
        
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group">
              <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-center object-cover group-hover:opacity-75"
                />
              </div>
              <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
              <p className="mt-1 text-xs text-gray-500">{product.category}</p>
              <button className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage; 