import React, { useCallback, useEffect, useRef } from 'react'
import { navbarStyles } from '../assets/dummyStyles'
import logo from '../assets/logo.png'
import { Link, useNavigate } from 'react-router-dom'
import { useUser, useAuth, useClerk, SignedOut } from '@clerk/clerk-react'
import { useState } from 'react'

const Navbar = () => {

    const [Open, setOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    const { user } = useUser()
    const { getToken, isSignedIn } = useAuth()
    const clerk = useClerk()
    const navigate = useNavigate()
    const profileRef = useRef(null)
    const TOKEN_KEY = "token"

    // for token generation (meeting fetch and store also refresh token)

    const fetchandStoreToken = useCallback(async (options) => {
        try {
            if (!getToken) {
                console.log("getToken is not available");
                return null
            }
            console.log("Attempting to get token with options:", options);
            const token = options
                ? await getToken(options).catch((e) => {
                      console.error("Clerk getToken error:", e);
                      return null;
                  })
                : await getToken().catch((e) => {
                      console.error("Clerk getToken error:", e);
                      return null;
                  });

            if (token) {
                try {
                    localStorage.setItem(TOKEN_KEY, token);
                    console.log("Token successfully retrieved:", token);
                } catch (error) {
                    console.error("Local storage error:", error);
                }
                return token
            }
            else {
                console.log("No token was returned from clerk");
                return null
            }
        } catch (error) {
            console.error("Unexpected error in fetchandStoreToken:", error);
            return null
        }
    }, [getToken]);

    // keep the localStorage token in sync with clerk auth state

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (isSignedIn) {
                const t = await fetchandStoreToken().catch(
                    () => null
                )
                if (!t && mounted) {
                    await fetchandStoreToken({ forceRefresh: true }).catch(() => null)
                }
            } else {
                try {
                    localStorage.removeItem(TOKEN_KEY)
                } catch (error) {
                    // ignore any errors
                }
            }
        })();

        return () => {
            mounted = false
        }
    }, [isSignedIn, user, fetchandStoreToken])

    // After successfull login redirect us to dashboard
    useEffect(() => {
        if (isSignedIn) {
            const pathname = window.location.pathname || "/";
            if (
                pathname === "/login" ||
                pathname === "/sign-up" ||
                pathname.startsWith("/auth") ||
                pathname === "/"
            ) {
                navigate("/app/dashboard", { replace: true })
            }
        }
    });

    // Close profile popover on outside click
    useEffect(() => {
        function onDocClick(e) {
            if (!profileRef.current) return;
            if (!profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        }
        if (profileOpen) {
            document.addEventListener("mousedown", onDocClick);
            document.addEventListener("touchstart", onDocClick);
        }
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("touchstart", onDocClick);
        };
    }, [profileOpen]);

    // to open login model
    const openSingnIn = () => {
        try {
            if (clerk && typeof clerk.openSignIn === 'function') {
                clerk.openSignIn()
            } else {
                console.log('clerk is not available')
                navigate('/login')
            }
        } catch (error) {
            console.log(error)
            navigate('/login')
        }
    }

    // to open sign up model

    const openSignUp = () => {
        try {
            if (clerk && typeof clerk.openSignUp === 'function') {
                clerk.openSignUp()
            } else {
                console.log('clerk is not available')
                navigate('/sign-up')
            }
        } catch (error) {
            console.log(error)
            navigate('/sign-up')
        }
    }

    // ADD THIS TEMPORARY FUNCTION TO TEST TOKEN FETCHING MANUALLY
    const testToken = async () => {
        try {
            console.log("Button clicked! isSignedIn is:", isSignedIn);
            console.log("Fetching token manually...");
            const t = await getToken();
            console.log("Manual Button Token Result:", t);
        } catch (e) {
            console.error("Manual Button Token Error:", e);
        }
    }

    return (
        <header className={navbarStyles.header}>
            <div className={navbarStyles.container}>
                <nav className={navbarStyles.nav}>
                    <div className={navbarStyles.logoSection}>
                        <Link to="/" className={navbarStyles.logoLink}>
                            <img src={logo} alt="Logo" className={navbarStyles.logoImage} />
                            <span className={navbarStyles.logoText}>AI_Invoice</span>
                        </Link>
                        <div className={navbarStyles.desktopNav}>
                            <a href="#feature" className={navbarStyles.navLink}>Features</a>
                            <a href="#pricing" className={navbarStyles.navLink}>Pricing</a>
                        </div>
                    </div>
                    <div className='flex items-center gap-4'>
                        <div className={navbarStyles.authSection}>
                            {/* TEMPORARY TEST BUTTON */}
                            {isSignedIn && (
                                <button onClick={testToken} className="px-4 py-2 bg-red-500 text-white rounded font-bold mr-4">
                                    TEST TOKEN
                                </button>
                            )}

                            <SignedOut>
                                <button onClick={openSingnIn} className={navbarStyles.signInButton} type='button'>
                                    Sign In
                                </button>
                                <button onClick={openSignUp} className={navbarStyles.signUpButton} type='button'>
                                    <div className={navbarStyles.signUpOverlay}></div>
                                    <span className={navbarStyles.signUpText}>Get Started</span>
                                    <svg className={navbarStyles.signUpIcon}
                                        viewBox="0 0 24 24"
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </SignedOut>
                        </div>
                        {/*---------Mobile Menu Button---------*/}
                        <button
                            onClick={() => setOpen(!Open)}
                            className={navbarStyles.mobileMenuButton}
                            aria-label="Toggle menu"
                        >
                            <div className={navbarStyles.mobileMenuIcon}>
                                <span className={`${navbarStyles.mobileMenuLine1} ${Open
                                    ? navbarStyles.mobileMenuLine1Open : navbarStyles.mobileMenuLine1Closed}`}>

                                </span>

                                <span className={`${navbarStyles.mobileMenuLine2} ${Open
                                    ? navbarStyles.mobileMenuLine2Open : navbarStyles.mobileMenuLine2Closed}`}>

                                </span>

                                <span className={`${navbarStyles.mobileMenuLine3} ${Open
                                    ? navbarStyles.mobileMenuLine3Open : navbarStyles.mobileMenuLine3Closed}`}>

                                </span>
                            </div>
                        </button>

                    </div>
                </nav>
                <div className={`${Open ? "block" : "hidden"} ${navbarStyles.mobileMenu}`}>
                    <div className={navbarStyles.mobileMenuContainer}>
                        <a href="#feature" className={navbarStyles.mobileNavLink}>Features</a>
                        <a href="#pricing" className={navbarStyles.mobileNavLink}>Pricing</a>

                        <div className={navbarStyles.mobileAuthSection}>
                            <SignedOut>
                                <button onClick={openSingnIn} className={navbarStyles.mobileSignIn} >
                                    Sign In
                                </button>
                                <button onClick={openSignUp} className={navbarStyles.mobileSignUp} >
                                    Get Started
                                </button>

                            </SignedOut>

                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar