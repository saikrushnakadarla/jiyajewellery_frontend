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
      </Routes>
    </Router>
  );
}

export default App;
