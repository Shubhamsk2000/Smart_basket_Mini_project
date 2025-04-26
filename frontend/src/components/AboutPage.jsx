import React from 'react';

const AboutPage = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-8">About Smart Basket</h1>
        
        <div className="prose prose-lg text-gray-500">
          <p>
            Smart Basket is your one-stop online grocery store, designed to make your shopping experience as convenient as possible. 
            We understand that your time is valuable, which is why we've created a platform that allows you to shop for all your grocery 
            needs from the comfort of your home.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
          <p>
            Our mission is to provide fresh, high-quality groceries at competitive prices, delivered right to your doorstep. 
            We work directly with local farmers and suppliers to ensure that you get the best products available.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Story</h2>
          <p>
            Smart Basket was founded in 2023 by a group of friends who were frustrated with the traditional grocery shopping experience. 
            They wanted to create a solution that would save people time and make grocery shopping more enjoyable.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Values</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Quality: We never compromise on the quality of our products.</li>
            <li>Convenience: We strive to make your shopping experience as convenient as possible.</li>
            <li>Sustainability: We are committed to reducing our environmental impact.</li>
            <li>Community: We believe in giving back to the communities we serve.</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
          <p>
            Have questions or feedback? We'd love to hear from you! You can reach us at:
          </p>
          <ul className="list-none pl-0 space-y-2 mt-2">
            <li>Email: info@smartbasket.com</li>
            <li>Phone: (555) 123-4567</li>
            <li>Address: 123 Grocery Street, Food City, FC 12345</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 