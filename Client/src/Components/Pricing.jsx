import React, { useState } from 'react'
import { pricingCardStyles, pricingStyles } from '../assets/dummyStyles'
import { useClerk, useAuth, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../config/api'

const PricingCard = ({
    title,
    price,
    period,
    description,
    features = [],
    isPopular = false,
    isAnnual = false,
    delay = 0,
    isCurrentPlan = false,
    onCtaClick,
}) => (
    <div className={`${pricingCardStyles.card} ${isPopular ? pricingCardStyles.cardPopular :
        pricingCardStyles.cardRegular
        } `} style={{
            transitionDelay: `${delay}ms`
        }}>
        {isPopular && (
            <div className={pricingCardStyles.popularBadge}>
                <div className={pricingCardStyles.popularBadgeContent}>
                    Most Populer
                </div>
            </div>
        )}
        {isPopular && <div className={pricingCardStyles.gradientOverlay}></div>}
        <div className={pricingCardStyles.animatedBorder}>   </div>
        <div className={pricingCardStyles.content}>
            <div className={pricingCardStyles.header}>
                <h3 className={`${pricingCardStyles.title} ${isPopular ? pricingCardStyles.titlePopular :
                    pricingCardStyles.titleRegular
                    }`}>{title}</h3>
                <p className={pricingCardStyles.description}>{description}</p>
            </div>
            <div className={pricingCardStyles.priceContainer}>

                <div className={pricingCardStyles.priceContainer}>
                    <div className={pricingCardStyles.priceWrapper}>
                        <span className={`${pricingCardStyles.price} ${isPopular ? pricingCardStyles.pricePopular
                            : pricingCardStyles.priceRegular
                            }`}>{price}</span>
                        {period && <span className={pricingCardStyles.period}>/{period}</span>}
                    </div>
                    {isAnnual && <div className={pricingCardStyles.annualBadge}>Save 20% annually</div>}
                </div>
                <ul className={pricingCardStyles.featuresList}>
                    {features.map((feature, index) => (
                        <li key={index} className={pricingCardStyles.featureItem}>
                            <div
                                className={`
                ${pricingCardStyles.featureIcon}
                ${isPopular
                                        ? pricingCardStyles.featureIconPopular
                                        : pricingCardStyles.featureIconRegular
                                    }
              `}
                            >
                                <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <span className={pricingCardStyles.featureText}>{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* CTA area: show different button/label depending on auth state */}
                <div style={{ marginTop: 12 }}>
                    <SignedIn>
                        <button
                            type="button"
                            disabled={isCurrentPlan}
                            onClick={() =>
                                onCtaClick && onCtaClick({ title, isPopular, isAnnual })
                            }
                            className={`
              ${pricingCardStyles.ctaButton}
              ${isPopular
                                    ? pricingCardStyles.ctaButtonPopular
                                    : pricingCardStyles.ctaButtonRegular
                                }
               ${isCurrentPlan ? 'opacity-50 cursor-not-allowed grayscale' : ''}
            `}
                        >
                            <span
                                className={`
                ${pricingCardStyles.ctaButtonText}
                ${isPopular
                                        ? pricingCardStyles.ctaButtonTextPopular
                                        : pricingCardStyles.ctaButtonTextRegular
                                    }
              `}
                            >
                                {isCurrentPlan ? "Current Plan" : (isPopular ? "Get Started" : "Choose Plan")}
                            </span>
                        </button>
                    </SignedIn>

                    <SignedOut>
                        <button
                            type="button"
                            onClick={() =>
                                onCtaClick &&
                                onCtaClick(
                                    { title, isPopular, isAnnual },
                                    { openSignInFallback: true }
                                )
                            }
                            className={`
              ${pricingCardStyles.ctaButton}
              ${pricingCardStyles.ctaButtonRegular}
            `}
                        >
                            <span className={pricingCardStyles.ctaButtonText}>
                                Sign in to get started
                            </span>
                        </button>
                    </SignedOut>
                </div>
            </div>
            {isPopular && (
                <>
                    <div className={pricingCardStyles.cornerAccent1}></div>
                    <div className={pricingCardStyles.cornerAccent2}></div>
                </>
            )}

        </div>

    </div>

)


const Pricing = () => {

    const [billingPeriod, setBillingPeriod] = useState("monthly")
    const clerk = useClerk();
    const { isSignedIn, getToken } = useAuth();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);

    React.useEffect(() => {
        let mounted = true;
        async function fetchProfile() {
            if (!isSignedIn) return;
            try {
                const token = await getToken();
                if (!token) return;
                const res = await fetch(`${API_BASE}/api/businessprofile/get`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.data && mounted) setUserProfile(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            }
        }
        fetchProfile();
        return () => mounted = false;
    }, [isSignedIn, getToken]);

    const plans = {
        monthly: [
            {
                title: "Starter",
                price: "₹0",
                period: "month",
                description: "Perfect for freelancers and small projects",
                features: [
                    "5 invoices per month",
                    "Basic AI parsing",
                    "Standard templates",
                    "Email support",
                    "PDF export",
                ],
                isPopular: false,
            },
            {
                title: "Professional",
                price: "₹50",
                period: "month",
                description: "For growing businesses and agencies",
                features: [
                    "Unlimited invoices",
                    "Advanced AI parsing",
                    "Custom branding",
                    "Priority support",
                    "Advanced analytics",
                    "Team collaboration (3 members)",
                    "API access",
                ],
                isPopular: true,
            },
            {
                title: "Enterprise",
                price: "₹500",
                period: "year",
                description: "For large organizations with custom needs",
                features: [
                    "Everything in Professional",
                    "Unlimited team members",
                    "Custom workflows",
                    "Dedicated account manager",
                    "SLA guarantee",
                    "White-label solutions",
                    "Advanced security",
                ],
                isPopular: false,
            },
        ],
        annual: [
            {
                title: "Starter",
                price: "₹0",
                period: "month",
                description: "Perfect for freelancers and small projects",
                features: [
                    "5 invoices per month",
                    "Basic AI parsing",
                    "Standard templates",
                    "Email support",
                    "PDF export",
                ],
                isPopular: false,
                isAnnual: false,
            },
            {
                title: "Professional",
                price: "₹500",
                period: "year",
                description: "For growing businesses and agencies",
                features: [
                    "Unlimited invoices",
                    "Advanced AI parsing",
                    "Custom branding",
                    "Priority support",
                    "Advanced analytics",
                    "Team collaboration (3 members)",
                    "API access",
                ],
                isPopular: true,
                isAnnual: true,
            },
            {
                title: "Enterprise",
                price: "₹500",
                period: "year",
                description: "For large organizations with custom needs",
                features: [
                    "Everything in Professional",
                    "Unlimited team members",
                    "Custom workflows",
                    "Dedicated account manager",
                    "SLA guarantee",
                    "White-label solutions",
                    "Advanced security",
                ],
                isPopular: false,
                isAnnual: true,
            },
        ],
    };

    const currentPlans = plans[billingPeriod];

    const handleCtaClick = async (planMeta, flags = {}) => {
        if (flags.openSignInFallback || !isSignedIn) {
            const redirectUrl = `/pricing?plan=${encodeURIComponent(planMeta?.title || '')}&period=${encodeURIComponent(billingPeriod)}`;
            if (clerk && typeof clerk.openSignIn === 'function') {
                clerk.openSignIn({ redirectUrl });
            }
            else {
                navigate(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
            }
            return;
        }

        const plan = planMeta?.title;

        // Free plan logic - just go to dashboard/create invoice
        if (!plan || plan === 'Starter') {
            navigate('/app/dashboard');
            return;
        }

        // Paid plan logic - proceed to Cashfree
        try {
            console.log("Starting payment process...");
            const token = await getToken();
            console.log("Token retrieved:", !!token);
            if (!token) {
                alert("Authentication required. Please sign in to continue with payment.");
                return;
            }

            const sessionRes = await fetch(`${API_BASE}/api/payment/create-checkout-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                    // Authorization: `Bearer ${token}` // Temporarily removed for testing
                },
                body: JSON.stringify({ plan: plan, period: billingPeriod })
            });

            console.log("API response status:", sessionRes.status);

            let sessionData = null;
            let rawText = "";
            try {
                rawText = await sessionRes.text();
                console.log("Raw response:", rawText);
                if (rawText && rawText.trim()) {
                    sessionData = JSON.parse(rawText);
                } else {
                    console.warn("Empty response body from server");
                }
            } catch (parseErr) {
                console.error("Failed to parse payment response:", parseErr);
                console.error("Response text was:", rawText);
                throw new Error(`Invalid response from payment server: ${parseErr.message}`);
            }

            if (!sessionRes.ok) {
                const msg = sessionData?.message || `Payment request failed (${sessionRes.status})`;
                console.error("Payment endpoint error:", { status: sessionRes.status, data: sessionData, rawText });
                throw new Error(msg);
            }

            console.log("Session data received:", sessionData);

            if (!sessionData || !sessionData.success || !sessionData.payment_session_id) {
                throw new Error(sessionData?.message || "Failed to create checkout session");
            }

            // Load Cashfree JS SDK if not already loaded
            if (!window.Cashfree) {
                console.log("Loading Cashfree SDK...");
                
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
                    script.onload = () => {
                        console.log("Cashfree SDK loaded successfully");
                        console.log("window.Cashfree available:", !!window.Cashfree);
                        resolve();
                    };
                    script.onerror = (error) => {
                        console.error("Failed to load Cashfree SDK:", error);
                        reject(error);
                    };
                    document.head.appendChild(script);
                });
            } else {
                console.log("Cashfree SDK already loaded");
            }

            // Initialize Cashfree
            console.log("Initializing Cashfree");
            const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || "production";
            let cashfree;
            try {
                // Try the function-style initializer used in the SDK
                if (window.Cashfree && typeof window.Cashfree === 'function') {
                    cashfree = window.Cashfree({ mode: cashfreeMode });
                    console.log("Cashfree instance created with config:", { mode: cashfreeMode });
                } else if (window.Cashfree && typeof window.Cashfree.checkout === 'function') {
                    // Direct checkout method (already initialized)
                    cashfree = window.Cashfree;
                    console.log("Using direct Cashfree.checkout method");
                } else {
                    throw new Error("Cashfree SDK not properly loaded");
                }
                console.log("Cashfree instance:", cashfree);
                console.log("Available methods:", typeof cashfree.checkout === 'function' ? 'checkout available' : 'checkout not available');
            } catch (initError) {
                console.error("Failed to initialize Cashfree:", initError);
                throw initError;
            }

            console.log("Starting payment with session ID:", sessionData.payment_session_id);

            // Start payment
            try {
                let checkoutResult;
                if (typeof cashfree.checkout === 'function') {
                    // Instance method
                    checkoutResult = await cashfree.checkout({
                        paymentSessionId: sessionData.payment_session_id,
                        mode: cashfreeMode,
                        redirectTarget: "_self"
                    });
                } else if (typeof window.Cashfree.checkout === 'function') {
                    // Static method
                    checkoutResult = await window.Cashfree.checkout({
                        paymentSessionId: sessionData.payment_session_id,
                        mode: cashfreeMode,
                        redirectTarget: "_self"
                    });
                } else {
                    throw new Error("No checkout method available");
                }
                console.log("Checkout initiated successfully:", checkoutResult);
            } catch (checkoutError) {
                console.error("Cashfree checkout error:", checkoutError);
                throw checkoutError;
            }

        } catch (err) {
            console.error("Payment initiation failed:", err);
            alert("Failed to initiate payment: " + err.message);
        }
    }

    // Capture return from sign-in if the URL contains plan and period intent
    React.useEffect(() => {
        if (!isSignedIn || !userProfile) return;

        const params = new URLSearchParams(window.location.search);
        const urlPlan = params.get('plan');
        const urlPeriod = params.get('period');

        if (urlPlan && urlPeriod) {
            const matchedPlan = plans[urlPeriod]?.find(p => p.title === urlPlan);
            if (matchedPlan) {
                // Clear URL params so we don't trigger it again on reload
                window.history.replaceState({}, document.title, window.location.pathname);

                // Keep billing period in sync just visually
                setBillingPeriod(urlPeriod);

                // Immediately trigger click logic
                handleCtaClick(matchedPlan);
            }
        }
    }, [isSignedIn, userProfile]);

    return (
        <section id='pricing' className={pricingStyles.section}>
            <div className={pricingStyles.bgElement1}></div>
            <div className={pricingStyles.bgElement2}></div>
            <div className={pricingStyles.bgElement3}></div>

            <div className={pricingStyles.container}>
                <div className={pricingStyles.headerContainer}>
                    {new URLSearchParams(window.location.search).get('expired') ? (
                        <div className={`${pricingStyles.badge} bg-red-100 text-red-800 border-red-200`}>
                            <span className={`${pricingStyles.badgeDot} bg-red-500`}></span>
                            <span className={pricingStyles.badgeText}>Subscription Expired - Please Renew</span>
                        </div>
                    ) : (
                        <div className={pricingStyles.badge}>
                            <span className={pricingStyles.badgeDot}></span>
                            <span className={pricingStyles.badgeText}>Transparent Pricing</span>
                        </div>
                    )}
                </div>
                <h2 className={pricingStyles.title}>
                    Simple, {" "}
                    <span className={pricingStyles.titleGradient}>Fair Pricing</span>
                </h2>
                <p className={pricingStyles.description}>
                    Start free, upgrade as you grow. no hidden fess. no surprice Charges.
                </p>
                <div className="text-center w-full">
                    <div style={{ marginTop: 12 }} className={pricingStyles.billingToggle}>
                        <button onClick={() => setBillingPeriod("monthly")}
                            className={`${pricingStyles.billingButton} ${billingPeriod === "monthly"
                                ? pricingStyles.billingButtonActive
                                : ""
                                } `} >
                            Monthly
                        </button>

                        <button onClick={() => setBillingPeriod("annual")}
                            className={`${pricingStyles.billingButton} ${billingPeriod === "annual"
                                ? pricingStyles.billingButtonActive
                                : ""
                                } `} >
                            Annual
                            <span className={pricingStyles.billingBadge}>Save 20%</span>
                        </button>

                    </div>
                </div>
            </div >

            <div className={pricingStyles.grid}>
                {currentPlans.map((plan, index) => {
                    // Check if user already has this exact plan active
                    const isCurrentPlan = userProfile?.subscriptionStatus === 'active'
                        && userProfile?.subscriptionPlan === plan.title;

                    return (
                        <PricingCard
                            key={plan.title}
                            {...plan}
                            delay={index * 100}
                            isCurrentPlan={isCurrentPlan}
                            onCtaClick={handleCtaClick}
                        />
                    )
                })}
            </div>
            <div className={pricingStyles.additionalInfo}>
                <div className={pricingStyles.featuresCard}>
                    <h3 className={pricingStyles.featuresTitle}>All Plan Includes</h3>
                    <div className={pricingStyles.featuresGrid}>
                        {[
                            "Secure cloud storage",
                            "Mobile-friendly interface",
                            "Automatic backups",
                            "Real-time notifications",
                            "Multi-currency support",
                            "Tax calculation",
                        ].map((feature, index) => (
                            <div key={index} className={pricingStyles.featureItem}>
                                <div className={pricingStyles.featureDot}></div>
                                <span>{feature}</span>

                            </div>
                        ))}


                    </div>
                </div>
            </div>
            <div className={pricingStyles.faqCta}>
                <p className={pricingStyles.faqText}>
                    Have questions about pricing ? {" "}
                    <button className={pricingStyles.contactLink}>
                        Contact our sales team →
                    </button>
                </p>

            </div>

        </section >
    );
}

export default Pricing; 