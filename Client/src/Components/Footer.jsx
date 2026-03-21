import React from 'react'
import { footerStyles } from '../assets/dummyStyles'

const Footer = () => {
    return (
        <footer className={footerStyles.footer}>
            <div className={footerStyles.container}>
                <p className={footerStyles.copyright}>
                    &copy; {new Date().getFullYear()} AI Billing Software. All rights reserved.
                </p>
                <div className={footerStyles.links}>
                    <a href="#about" className={footerStyles.link}>About Us</a>
                    <a href="#privacy" className={footerStyles.link}>Privacy Policy</a>
                    <a href="#terms" className={footerStyles.link}>Terms of Service</a>
                    <a href="#contact" className={footerStyles.link}>Contact</a>
                </div>
            </div>
        </footer>
    )
}

export default Footer