import React from 'react'
import { featuresStyles } from '../assets/dummyStyles'

const Feature = () => {
    const features = [
        {
            title: "AI Invoice Parsing",
            desc: "Paste freeform text and let our advanced AI extract client details, line items, and totals into a perfectly formatted draft invoice in seconds.",
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10,9 9,9 8,9" />
                </svg>
            ),
        },
        {
            title: "Smart Email Reminders",
            desc: "Generate professional, context-aware reminder emails with one click — complete with intelligent tone selection and personalized messaging.",
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
            ),
        },
        {
            title: "Professional PDF Export",
            desc: "Generate high-quality, brand-consistent PDF invoices with reliable email delivery and comprehensive tracking of all sent communications.",
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10,9 9,9 8,9" />
                </svg>
            ),
        },
    ];
    return (
        <section id='feature' className={featuresStyles.section}>
            <div className={featuresStyles.backgroundBlob1}></div>
            <div className={featuresStyles.backgroundBlob2}></div>
            <div className={featuresStyles.backgroundBlob3}></div>

            <div className={featuresStyles.container}>
                <div className={featuresStyles.headerContainer}>
                    <div className={featuresStyles.badge}>
                        <span className={featuresStyles.badgeDot}></span>
                        <span className={featuresStyles.badgeText}>Powerfull Features</span>
                    </div>
                    <h2 className={featuresStyles.title}>
                        Built for{" "}
                        <span className={featuresStyles.titleGradient}>
                            Speed & Clarity
                        </span>
                    </h2>
                    <p className={featuresStyles.subtitle}>
                        A minimal intelligent interface that focuses on what truly matters
                        - create, send, and track invoice effortlessly while maintaning professional excellence.
                    </p>
                </div>

                <div className={featuresStyles.featuresGrid}>
                    {features.map((feature, index) => (
                        <div key={index} className={featuresStyles.featureCard}>
                            <div className={featuresStyles.featureCardGradient}></div>
                            <div className={featuresStyles.featureCardBorder}></div>
                            <div className={featuresStyles.featureCardContent}>
                                <div className={featuresStyles.featureCardIconContainer}>
                                    {feature.icon}
                                </div>
                                <div className={featuresStyles.featureCardTextContainer}>
                                    <h3 className={featuresStyles.featureCardTitle}>
                                        {feature.title}
                                    </h3>
                                    <p className={featuresStyles.featureCardDescription}>
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/*-----bottom---*/}
                <div className={featuresStyles.bottomCtaContainer}>
                    <button type='button' className={featuresStyles.bottomCtaButton}>
                        <span className={featuresStyles.bottomCtaButtonText}>Explore All Features</span>
                        {/* Bottom CTA */}
                        <svg
                            className={featuresStyles.bottomCtaButtonIcon}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                </div>
            </div>

        </section>
    )
}

export default Feature