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
import CustomerDashboard from './Components/Modules/Customer/CustomerDashboard';
import SalesPersonDashboard from './Components/Modules/SalesPerson/SalesPersonDashboard';
import Purity from './Components/Modules/Admin/Masters/Puritymaster/Purity';
import Rates from "./Components/Modules/Admin/Masters/RatesMaster/RatesForm"
import Metaltype from './Components/Modules/Admin/Masters/Metaltypemaster/Metaltype';
import Designmaster from './Components/Modules/Admin/Masters/Designmaster/Designmaster';
import PurityForm from './Components/Modules/Admin/Masters/Puritymaster/PurityForm';
import Designmasterform from './Components/Modules/Admin/Masters/Designmaster/Designmasterform';
import Metaltypeform from './Components/Modules/Admin/Masters/Metaltypemaster/Metaltypeform';
import CategoryProducts from './Components/Modules/Admin/Masters/CategoryProducts/CategoryProducts';
import CategoryForm from './Components/Modules/Admin/Masters/CategoryProducts/CategoryForm';
import ProductMaster from './Components/Modules/Admin/Masters/ProductMaster/ProductMaster';
import ProductForm from './Components/Modules/Admin/Masters/ProductMaster/ProductForm';
import EstimateTable from './Components/Modules/Admin/Transactions/EstimateTable';
import EstimateForm from './Components/Modules/Admin/Transactions/EstimateForm';
import CustomerEstimateTable from './Components/Modules/Customer/Transactions/EstimateTable';
import CustomerEstimateForm from './Components/Modules/Customer/Transactions/EstimateForm';
import ProductCatalog from "./Components/Modules/Customer/ProductCatalog/ProductCatalog"
import SalesPersonEstimateTable from './Components/Modules/SalesPerson/Transactions/EstimateTable';
import SalesPersonEstimateForm from './Components/Modules/SalesPerson/Transactions/EstimateForm';

import RatesForm from './Components/Modules/Admin/Masters/RatesMaster/RatesForm';
import CartCatalog from './Components/Modules/Customer/CartCatalog/CartCatalog';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/customerregistration" element={<CustomerRegistration />} />
        <Route path="/" element={<Login />} />
        <Route path='/salepersonregister' element={<SalespersonRegister />} />
        <Route path='/adminhome' element={<AdminHome />} />
        <Route path='/customers' element={<Customers />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/salesperson-dashboard" element={<SalesPersonDashboard />} />
        <Route path='/salespersontable' element={<SalesPersonTable />} />

        <Route path='/purity' element={<Purity />} />
        <Route path='/purityform' element={<PurityForm />} />
        <Route path='/rates' element={<Rates />} />
        <Route path='/ratesform' element={<RatesForm />} />
        <Route path='/metaltype' element={<Metaltype />} />
        <Route path='/metaltypeform' element={<Metaltypeform />} />
        <Route path='/designmaster' element={<Designmaster />} />
        <Route path='/designmasterform' element={<Designmasterform />} />
        <Route path='/c-products' element={<CategoryProducts />} />
        <Route path='/categoryform' element={<CategoryForm />} />
        <Route path='/productmaster' element={<ProductMaster />} />
        <Route path='/productform' element={<ProductForm />} />

        <Route path='/estimation' element={<EstimateTable />} />
        <Route path='/estimates' element={<EstimateForm />} />

        <Route path='/customer-estimation' element={<CustomerEstimateTable />} />
        <Route path='/customer-estimates' element={<CustomerEstimateForm />} />
        <Route path='/product-catalog' element={<ProductCatalog />} />
        <Route path='/cart-catalog' element={<CartCatalog />} />

        <Route path='/salesperson-estimation' element={<SalesPersonEstimateTable />} />
        <Route path='/salesperson-estimates' element={<SalesPersonEstimateForm />} />

      </Routes>
    </Router>
  );
}

export default App;
