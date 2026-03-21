import React from 'react'
import Navbar from '../Components/Navbar'
import Hero from '../Components/Hero'
import Feature from '../Components/Feature'
import Pricing from '../Components/Pricing'
import Footer from '../Components/Footer'

const Home = () => {
    return (
        <div>
            <Navbar />
            <main className=''>
                <Hero />
                <div className=' '>
                    <Feature />
                </div>
                <Pricing />
            </main>
            <Footer />
        </div>
    )
}

export default Home