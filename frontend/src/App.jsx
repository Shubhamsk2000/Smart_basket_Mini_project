import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationBar from './components/NavigationBar';
import HomePage from './components/HomePage';
import ProductsPage from './components/ProductsPage';
import CategoriesPage from './components/CategoriesPage';
import AboutPage from './components/AboutPage';
import Cart from './components/Cart';
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <NavigationBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
