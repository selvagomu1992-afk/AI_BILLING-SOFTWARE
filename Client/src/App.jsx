import React, { Children, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './Pages/Home'
import AppShell from './Components/AppShell'
import Dasboard from './Pages/Dasboard'
import CreateInvoice from './Pages/CreateInvoice'
import Invoice from './Pages/Invoice'
import InvoicePreview from './Pages/InvoicePreview'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import BusinessProfile from './Pages/BusinessProfile'
import PricingPage from './Pages/PricingPage'

const ClerkProtected = ({ children }) => {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

const App = () => {
  useEffect(() => {
    // Suppress the Cashfree mobile SDK error in web browsers
    const handleError = (event) => {
      if (event.message && event.message.includes('PaymentJSInterface')) {
        console.warn('Suppressed Cashfree mobile SDK error (not critical for web)');
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div className='min-h-screen max-w-full overflow-x-hidden'>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/pricing' element={<PricingPage />} />
        {/* it must be protected */}
        <Route path='/app' element={<ClerkProtected><AppShell /></ClerkProtected>}>
          <Route index element={<Dasboard />} />
          <Route path='dashboard' element={<Dasboard />} />

          <Route path='invoices' element={<Invoice />} />
          <Route path='invoices/new' element={<CreateInvoice />} />
          <Route path='invoices/:id' element={<InvoicePreview />} />
          <Route path='invoices/:id/preview' element={<InvoicePreview />} />
          <Route path='invoices/:id/edit' element={<CreateInvoice />} />

          <Route path='create-invoice' element={<CreateInvoice />} />
          <Route path='business' element={<BusinessProfile />} />
        </Route>
      </Routes>

    </div>
  );
}

export default App