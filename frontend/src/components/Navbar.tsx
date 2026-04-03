import { useState } from "react";
import logo from '../assets/newlogo2.png';

import { Button, Nav, Offcanvas } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CurrencySelector from "./CurrencySelector";

type NavbarProps = {
  variant?: "default" | "main";
};

const Navbar = ({ variant = "default" }: NavbarProps) => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const location = useLocation();

  if (loading) return null;

  // ✅ Role flags
  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";
  const isTrainer = user?.role === "trainer";

  // ✅ Dashboard link fix
  const dashboardLink = user
    ? user.role === "trainer"
      ? "/trainer"
      : user.role === "admin"
      ? "/admin"
      : "/student"
    : "/login";

  const handleScroll = (id: string) => {
    if (location.pathname === "/about") {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="flex w-full h-[75px] md:h-[85px] bg-[#203989] text-white">

        {/* LEFT */}
        <div className="w-fit flex items-center pl-1 md:pl-4 h-20">
          <Link to="/" className="h-full flex items-center">
            <img
              src={logo}
              alt="LearnILM World"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex items-center justify-end pr-4 md:pr-10">

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-8">

            {/* {variant === "main" && (
              <CurrencySelector variant="header" />
            )} */}

            {!isLoggedIn || isAdmin  ? (
              <>
                <Link
                    to="/about#about"
                    onClick={() => handleScroll("about")}
                    className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                    >
                    About
                </Link>
                <Link
                    to="/careers"
                    onClick={() => handleScroll("careers")}
                    className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                    >
                    Careers
                </Link>
                <Link to="/about#help"
                    onClick={() => handleScroll("help")}
                    className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                    >
                    Help
                </Link>

                {isAdmin ? (
                  <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                >
                  Log Out
                </button>
                ) : (
                <Link 
                  to="/login"
                  className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                  >
                  Sign In
                </Link>
                )}

                {isAdmin ? (
                  <Link to={dashboardLink} 
                  className="px-6 py-2 rounded-full bg-white text-[#024AAC] text-sm font-bold shadow hover:scale-105 transition"
                  >
                  Dashboard
                </Link>
                ): (
                <Link
                  to="/register"
                  className="px-6 py-2 rounded-full bg-white text-[#024AAC] text-base font-bold shadow hover:scale-105 transition"
                >
                  Get Started
                </Link>
                )}
              </>
            ) : (
              <>
                {isTrainer ? (<Link to="/trainer/sessions"
                  onClick={() => handleScroll("sessions")}
                  className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                  >
                  My Sessions
                </Link>
                ) : (<Link to="/student/sessions"
                  onClick={() => handleScroll("sessions")}
                  className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                  >
                  My Sessions
                </Link>
                )}

                {isTrainer ? (
                  <Link to="/trainer/students"
                    onClick={() => handleScroll("students")}
                    className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                    >
                    My Students
                  </Link>
                ) : (
                  <Link to="/main" 
                    onClick={() => handleScroll("trainers")}
                    className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                    >
                    Find Trainers
                  </Link>
                )}

                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="relative text-lg font-medium text-white transition-all duration-300 no-underline hover:text-black hover:-translate-y-1 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                >
                  Log Out
                </button>

                <Link to={dashboardLink} 
                  className="px-6 py-2 rounded-full bg-white text-[#024AAC] text-sm font-bold shadow hover:scale-105 transition"
                  >
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* MOBILE MENU */}
          <div className="lg:hidden ml-auto flex items-center">
            <Button
              variant="link"
              className="text-white text-4xl p-0 no-underline"
              onClick={() => setShowOffcanvas(true)}
            >
              ☰
            </Button>

            <Offcanvas
              show={showOffcanvas}
              onHide={() => setShowOffcanvas(false)}
              placement="end"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title>Menu</Offcanvas.Title>
              </Offcanvas.Header>

              <Offcanvas.Body>
                <Nav className="flex-column gap-4">
                  {/*  Currency selector in mobile (main variant only) */}
                  {/* {variant === "main" && (
                    <CurrencySelector
                      variant="header"
                      onSelect={() => setShowOffcanvas(false)}
                    />
                  )} */}

                  {!isLoggedIn || isAdmin ? (
                    <>
                      <Nav.Link as={Link} to="/about#about"
                      onClick={() => {
                      handleScroll("about");
                      setShowOffcanvas(false);
                    }}
                      >
                        About
                      </Nav.Link>
                      <Nav.Link as={Link} 
                      to="/careers"
                      onClick={() => {
                      handleScroll("careers");
                      setShowOffcanvas(false);
                      }}
                      >
                        Careers
                      </Nav.Link>
                      <Nav.Link as={Link} 
                      to="/about#help"
                      onClick={() => {
                      handleScroll("help");
                      setShowOffcanvas(false);
                      }}
                      >
                        Help
                      </Nav.Link>

                      {isAdmin ? (
                        <Nav.Link as={Link} to={dashboardLink}>
                          Dashboard
                        </Nav.Link>
                      ) : (
                        <Link
                          to="/register"
                          onClick={() => setShowOffcanvas(false)}
                          className="w-full mt-2 block text-center px-4 py-2 rounded-full bg-[#276dc9] text-white font-bold no-underline"
                        >
                          Get Started
                        </Link>
                      )}

                      {isAdmin ? (
                        <button
                        onClick={() => {
                          logout();
                          navigate("/login");
                          setShowOffcanvas(false);
                        }}
                        className="w-full mt-2 px-4 py-2 rounded-full bg-[#276dc9] text-white font-bold"
                        >
                          Log Out
                        </button>
                      ) : (
                        <Nav.Link as={Link} 
                        to="/login"
                        onClick={() => setShowOffcanvas(false)}
                        >
                          Sign In
                        </Nav.Link>
                      )}
                    </>
                  ) : (
                    <>
                      {isTrainer ? (
                        <Nav.Link as={Link} 
                          to="/trainer/sessions"
                          onClick={() => {
                          handleScroll("sessions");
                          setShowOffcanvas(false);
                        }}
                        >
                        My Sessions
                      </Nav.Link>
                      ) : (
                        <Nav.Link as={Link} 
                          to="/student/sessions"
                          onClick={() => {
                          handleScroll("sessions");
                          setShowOffcanvas(false);
                        }}
                        >
                          My Sessions
                      </Nav.Link>
                      )}
                      

                      {isTrainer ? (
                        <Nav.Link as={Link} 
                        to="/trainer/students"
                        onClick={() => {
                          handleScroll("students");
                          setShowOffcanvas(false);
                        }}
                        >
                          My Students
                        </Nav.Link>
                      ) : (
                        <Nav.Link as={Link} 
                        to="/main"
                        onClick={() => {
                          handleScroll("trainers");
                          setShowOffcanvas(false);
                        }}
                        >
                          Find Trainers
                        </Nav.Link>
                      )}

                      <Nav.Link as={Link} to={dashboardLink}>
                        Dashboard
                      </Nav.Link>

                      <button
                        onClick={() => {
                          logout();
                          navigate("/login");
                          setShowOffcanvas(false);
                        }}
                        className="w-full mt-2 px-4 py-2 rounded-full bg-[#276dc9] text-white font-bold"
                      >
                        Log Out
                      </button>
                    </>
                  )}
                </Nav>
              </Offcanvas.Body>
            </Offcanvas>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;