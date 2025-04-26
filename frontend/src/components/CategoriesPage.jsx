import React from 'react';
import { Link } from 'react-router-dom';

const CategoriesPage = () => {
  const categories = [
    {
      id: 1,
      name: 'Fruits',
      image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'Fresh and juicy fruits from local farms.'
    },
    {
      id: 2,
      name: 'Vegetables',
      image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'Fresh vegetables for your healthy lifestyle.'
    },
    {
      id: 3,
      name: 'Dairy',
      image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'Milk, cheese, yogurt, and other dairy products.'
    },
    {
      id: 4,
      name: 'Bakery',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'Freshly baked bread and pastries.'
    },
    {
      id: 5,
      name: 'Meat',
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'High-quality meat products.'
    },
    {
      id: 6,
      name: 'Beverages',
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      description: 'Soft drinks, juices, and other beverages.'
    }
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Product Categories</h1>
        
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-3 xl:gap-x-8">
          {categories.map((category) => (
            <div key={category.id} className="group">
              <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-center object-cover group-hover:opacity-75"
                />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{category.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{category.description}</p>
              <Link
                to={`/products?category=${category.name.toLowerCase()}`}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Products
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage; 