import React from 'react'
import Navbar from '../Components/Navbar'
import Pricing from '../Components/Pricing'
import Footer from '../Components/Footer'

const PricingPage = () => {
    return (
        <div>
            <Navbar />
            <main className='pt-20'>
                <Pricing />
            </main>
            <Footer />
        </div>
    )
}

export default PricingPage
