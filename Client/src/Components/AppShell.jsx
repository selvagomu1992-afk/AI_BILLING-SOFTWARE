import React, { useEffect, useState } from 'react'
import { appShellStyles } from '../assets/dummyStyles'
import logo from '../assets/logo.png'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useClerk, useUser, useAuth } from '@clerk/clerk-react'

const AppShell = () => {

    const navigate = useNavigate();
    const { signOut } = useClerk()
    const { user } = useUser()
    const { getToken, isSignedIn } = useAuth();

    const [mobileOpen, setMobileOpen] = useState()
    const [businessProfile, setBusinessProfile] = useState(null)
    const [collapsed, setCollasped] = useState(() => {
        try {
            return localStorage.getItem("sidebar_collapsed") === "true";
        } catch {
            return false;
        }
    });
    const [scrolled, setScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check screen size for responsive behavior
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) setCollasped(false);
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("sidebar_collapsed", collapsed ? "true" : "false");
        } catch { }
    }, [collapsed]);

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    // Header scroll effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch Profile for global details
    useEffect(() => {
        let mounted = true;
        async function fetchProfile() {
            if (!isSignedIn) return;
            try {
                const token = await getToken();
                if (!token) return;
                const res = await fetch('http://localhost:5000/api/businessprofile/get', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.data && mounted) setBusinessProfile(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch profile in AppShell:", err);
            }
        }
        fetchProfile();
        return () => mounted = false;
    }, [isSignedIn, getToken]);

    // Calculate remaining days
    const getRemainingDaysText = () => {
        if (!businessProfile) return null;
        if (businessProfile.subscriptionPlan === 'Starter') return 'Free Plan';
        if (!businessProfile.subscriptionEndDate) return 'Active Plan';

        const endDate = new Date(businessProfile.subscriptionEndDate);
        const now = new Date();
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Expired';

        const dd = String(endDate.getDate()).padStart(2, '0');
        const mm = String(endDate.getMonth() + 1).padStart(2, '0');
        const yyyy = endDate.getFullYear();

        return `Expires ${dd}/${mm}/${yyyy} (${diffDays} Days Left)`;
    };

    // logout function
    const logout = async () => {
        try {
            await signOut();

        } catch (error) {
            console.warn("Signout error :", error);
        }
        navigate('/login')
    };

    // toggle sidebar
    const toggleSidebar = () => {
        setCollasped(!collapsed);
    };

    // display name helpers
    const displayName = (() => {
        if (!user) return "User";
        const name = user.fullName || user.firstName || user.username || "";
        return name.trim() || (user.email || "").split?.("@")?.[0] || "User";
    })();

    const firstName = () => {
        const parts = displayName.split(" ").filter(Boolean);
        return parts.length ? parts[0] : displayName;
    };

    const initials = () => {
        const parts = displayName.split(" ").filter(Boolean);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (
            parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    };

    // for icon
    /* ----- Icons (kept as you had) ----- */
    const DashboardIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );

    const InvoiceIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );

    const CreateIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
    );

    const ProfileIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );

    const LogoutIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );

    const CollapseIcon = ({ className = "w-4 h-4", collapsed }) => (
        <svg
            className={`${className} transition-transform duration-300 ${collapsed ? "rotate-180" : ""
                }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
        </svg>
    );

    /* ----- SidebarLink ----- */
    const SidebarLink = ({ to, icon, children }) => (
        <NavLink
            to={to}
            className={({ isActive }) => `
        ${appShellStyles.sidebarLink}
        ${collapsed ? appShellStyles.sidebarLinkCollapsed : ""}
        ${isActive
                    ? appShellStyles.sidebarLinkActive
                    : appShellStyles.sidebarLinkInactive
                }
      `}
            onClick={() => setMobileOpen(false)}
        >
            {({ isActive }) => (
                <>
                    <div
                        className={`${appShellStyles.sidebarIcon} ${isActive
                            ? appShellStyles.sidebarIconActive
                            : appShellStyles.sidebarIconInactive
                            }`}
                    >
                        {icon}
                    </div>
                    {!collapsed && (
                        <span className={appShellStyles.sidebarText}>{children}</span>
                    )}
                    {!collapsed && isActive && (
                        <div className={appShellStyles.sidebarActiveIndicator} />
                    )}
                </>
            )}
        </NavLink>
    );

    return (
        <div className={appShellStyles.root}>
            <div className={appShellStyles.layout}>
                {/*----Slidebar------*/}
                <aside className={`${appShellStyles.sidebar} ${collapsed ? appShellStyles.sidebarCollapsed
                    : appShellStyles.sidebarExpanded

                    }`}>
                    <div className={appShellStyles.sidebarGradient}></div>
                    <div className={appShellStyles.sidebarContainer}>
                        <div>
                            <div className={`${appShellStyles.logoContainer} ${collapsed ? appShellStyles.logoContainerCollapsed
                                : ""
                                }`}>
                                <Link to="/" className={appShellStyles.logoLink}>
                                    <div className='relative'>
                                        <img src={logo} alt="Logo" className={appShellStyles.logoImage} />
                                        <div className='absolute inset-0 rounded-lg blur-sm group-hover:blur-md transition-all
                                        duration-300'></div>
                                    </div>
                                    {!collapsed && (
                                        <div className={appShellStyles.logoTextContainer}>
                                            <span className={appShellStyles.logoText}>AI_Invoice</span>
                                            <div className={appShellStyles.logoUnderline}></div>
                                        </div>
                                    )}
                                </Link>
                                {!collapsed && (
                                    <button onClick={toggleSidebar} className={appShellStyles.collapseButton

                                    }>
                                        <CollapseIcon collapsed={collapsed} />
                                    </button>
                                )}
                            </div>

                            {/*-----for navigate---------*/}

                            <nav className={appShellStyles.nav}>
                                <SidebarLink to="/app/dashboard" icon={<DashboardIcon />}>
                                    Dashboard
                                </SidebarLink>
                                <SidebarLink to="/app/invoices" icon={<InvoiceIcon />}>
                                    Invoices
                                </SidebarLink>
                                <SidebarLink to="/app/create-invoice" icon={<CreateIcon />}>
                                    Create Invoice
                                </SidebarLink>
                                <SidebarLink to="/app/business" icon={<ProfileIcon />}>
                                    Business Profile
                                </SidebarLink>
                            </nav>

                        </div>
                        <div className={appShellStyles.userSection}>
                            <div className={`${appShellStyles.userDivider} ${collapsed ? appShellStyles.userDividerCollapsed
                                : appShellStyles.userDividerExpanded
                                }`}>
                                {!collapsed ? (
                                    <button onClick={logout} className={appShellStyles.logoutButton} >
                                        <LogoutIcon className={appShellStyles.logoutIcon} />
                                        <span className={appShellStyles.logoutText}>Logout</span>
                                    </button>
                                ) : (
                                    <button onClick={logout} className={`${appShellStyles.logoutButton} justify-center`} >
                                        <LogoutIcon className={appShellStyles.logoutIcon} />
                                    </button>
                                )}
                                <div className={appShellStyles.collapseSection}>
                                    <button onClick={toggleSidebar} className={`${appShellStyles.collapseButtonInner} 
                                    ${collapsed ? appShellStyles.collapseButtonCollapsed
                                            : ""
                                        }`}>
                                        {!collapsed && (
                                            <span>{collapsed ? "Expend " : "Collapsed "}</span>
                                        )}
                                        <CollapseIcon collapsed={collapsed} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </aside>
                {/*-----mobile view--------*/}
                {mobileOpen && (
                    <div className={appShellStyles.mobileOverlay}>
                        <div className={appShellStyles.mobileBackdrop}
                            onClick={() => setMobileOpen(false)}
                        />

                        <div className={appShellStyles.mobileSidebar}>
                            <div className={appShellStyles.mobileHeader}>
                                <Link to='/' className={appShellStyles.mobileLogoLink}
                                    onClick={() => setMobileOpen(false)} >
                                    <img src={logo} alt="logo" className={appShellStyles.mobileLogoImage} />
                                    <span className={appShellStyles.mobileLogoText}>
                                        AI_Invoice
                                    </span>
                                </Link>
                                <button onClick={() => setMobileOpen(false)} className={appShellStyles.mobileCloseButton}>
                                    <svg className={appShellStyles.mobileCloseIcon}
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth="2"                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {/*--------------navigate----------- */}
                            <svg
                                className={appShellStyles.mobileCloseIcon}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M6 18L18 6M6 6l12 12" />
                            </svg>


                            <nav className={appShellStyles.mobileNav}>
                                <NavLink
                                    onClick={() => setMobileOpen(false)}
                                    to="/app/dashboard"
                                    className={({ isActive }) =>
                                        `${appShellStyles.mobileNavLink} ${isActive
                                            ? appShellStyles.mobileNavLinkActive
                                            : appShellStyles.mobileNavLinkInactive
                                        }`
                                    }
                                >
                                    {" "}
                                    <DashboardIcon /> Dashboard
                                </NavLink>
                                <NavLink
                                    onClick={() => setMobileOpen(false)}
                                    to="/app/invoices"
                                    className={({ isActive }) =>
                                        `${appShellStyles.mobileNavLink} ${isActive
                                            ? appShellStyles.mobileNavLinkActive
                                            : appShellStyles.mobileNavLinkInactive
                                        }`
                                    }
                                >
                                    {" "}
                                    <InvoiceIcon /> Invoices
                                </NavLink>
                                <NavLink
                                    onClick={() => setMobileOpen(false)}
                                    to="/app/create-invoice"
                                    className={({ isActive }) =>
                                        `${appShellStyles.mobileNavLink} ${isActive
                                            ? appShellStyles.mobileNavLinkActive
                                            : appShellStyles.mobileNavLinkInactive
                                        }`
                                    }
                                >
                                    {" "}
                                    <CreateIcon /> Create Invoice
                                </NavLink>
                                <NavLink
                                    onClick={() => setMobileOpen(false)}
                                    to="/app/business"
                                    className={({ isActive }) =>
                                        `${appShellStyles.mobileNavLink} ${isActive
                                            ? appShellStyles.mobileNavLinkActive
                                            : appShellStyles.mobileNavLinkInactive
                                        }`
                                    }
                                >
                                    {" "}
                                    <ProfileIcon /> Business Profile
                                </NavLink>
                            </nav>
                            <div className={appShellStyles.mobileLogoutSection}>
                                <button onClick={() => {
                                    setMobileOpen(false);
                                    logout()
                                }} className={appShellStyles.mobileLogoutButton} >
                                    <LogoutIcon /> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/*--------MAIN GONTENT NAVBAR-----------*/}
                <div className='flex-1 min-w-0 ' style={{ position: 'relative', zIndex: 20 }}>
                    <header className={`${appShellStyles.header} ${scrolled ? appShellStyles.headerScrolled : appShellStyles.headerNotScrolled}`}>
                        <div className={appShellStyles.headerTopSection}>
                            <div className={appShellStyles.headerContent}>
                                <button onClick={() => setMobileOpen(true)} className={appShellStyles.mobileMenuButton}>
                                    <svg
                                        className={appShellStyles.mobileMenuIcon}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                {!isMobile && (
                                    <button onClick={toggleSidebar} className={appShellStyles.desktopCollapseButton}>
                                        <CollapseIcon collapsed={collapsed} />

                                    </button>
                                )}
                                <div className={appShellStyles.welcomeContainer}>
                                    <h2 className={appShellStyles.welcomeTitle}>
                                        Welcome back, {" "}
                                        <span className={appShellStyles.welcomeName}>
                                            {firstName()}
                                        </span>
                                    </h2>
                                    <p className={appShellStyles.welcomeSubtitle}>
                                        Ready to create amazing invoice?
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={appShellStyles.headerActions}>
                            <button onClick={() => navigate("/app/create-invoice")}
                                className={appShellStyles.ctaButton}>
                                <CreateIcon className={appShellStyles.ctaIcon} />
                                <span className="hidden xs:inline">Create Invoice</span>
                                <span className='xs:hidden'>Create</span>
                            </button>
                            {businessProfile && businessProfile.subscriptionPlan !== 'Starter' && (
                                <div className="flex items-center px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100 shadow-sm mr-2">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {businessProfile.subscriptionPlan} • {getRemainingDaysText()}
                                </div>
                            )}
                            <div className={appShellStyles.userSectionDesktop}>
                                <div className={appShellStyles.userInfo}>
                                    <div className={appShellStyles.userName}>{displayName}</div>
                                    <div className={appShellStyles.userEmail}>{user?.email}</div>
                                </div>

                                <div className={appShellStyles.userAvatarContainer}>
                                    <div className={appShellStyles.userAvatarContainer}>
                                        <div className={appShellStyles.userAvatar}>
                                            {initials()}
                                            <div className={appShellStyles.userAvatarBorder} />
                                        </div>
                                        <div className={appShellStyles.userStatus}>

                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </header>
                    <main className={appShellStyles.main}>
                        <div className={appShellStyles.mainContainer}>
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div >
        </div >
    )
}

export default AppShell 