import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import CustomerRegistration from './Components/Modules/CustomerRegistration/CustomerRegistration';
import Login from './Components/Pages/Login/Login'
import SalespersonRegister from './Components/Modules/Admin/Salespersonregistration/Salespersonsregistration';
import AdminHome from './Components/Modules/Admin/AdminHome/AdminHome';
import SalesPersonTable from './Components/Modules/Admin/Salespersonregistration/SalesPersonTable';
import Customers from './Components/Modules/Admin/Customers/Customers';
import Dashboard from './Components/Modules/Admin/Dashboard/Dashboard';
import Purity from './Components/Modules/Admin/Masters/Puritymaster/Purity';
import Metaltype from './Components/Modules/Admin/Masters/Metaltypemaster/Metaltype';
import Designmaster from './Components/Modules/Admin/Masters/Designmaster/Designmaster';
import PurityForm from './Components/Modules/Admin/Masters/Puritymaster/PurityForm';
import Designmasterform from './Components/Modules/Admin/Masters/Designmaster/Designmasterform';
import Metaltypeform from './Components/Modules/Admin/Masters/Metaltypemaster/Metaltypeform';
import CategoryProducts from './Components/Modules/Admin/Masters/CategoryProducts/CategoryProducts';
import CategoryForm from './Components/Modules/Admin/Masters/CategoryProducts/CategoryForm';
import ProductMaster from './Components/Modules/Admin/Masters/ProductMaster/ProductMaster';
import ProductForm from './Components/Modules/Admin/Masters/ProductMaster/ProductForm';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/customerregistration" element={<CustomerRegistration />} />
        <Route path="/login" element={<Login />} />
        <Route path='/salepersonregister' element={<SalespersonRegister />} />
        <Route path='/adminhome' element={<AdminHome />} />
        <Route path='/customers' element={<Customers />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/salespersontable' element={<SalesPersonTable />} />

        <Route path='/purity' element={<Purity />} />
        <Route path='/purityform' element={<PurityForm />} />
        <Route path='/metaltype' element={<Metaltype />} />
        <Route path='/metaltypeform' element={<Metaltypeform />} />
        <Route path='/designmaster' element={<Designmaster />} />
        <Route path='/designmasterform' element={<Designmasterform />} />
        <Route path='/c-products' element={<CategoryProducts />} />
        <Route path='/categoryform' element={<CategoryForm />} />
        <Route path='/productmaster' element={<ProductMaster />} />
        <Route path='/productform' element={<ProductForm />} />

      </Routes>
    </Router>
  );
}

export default App;
