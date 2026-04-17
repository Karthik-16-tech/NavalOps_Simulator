import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Anchor } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <StyledLoaderWrapper>
      <div className="loader" id="loader">
        <div className="loader-wrapper">
          <span className="loader-letter">L</span>
          <span className="loader-letter">o</span>
          <span className="loader-letter">a</span>
          <span className="loader-letter">d</span>
          <span className="loader-letter">i</span>
          <span className="loader-letter">n</span>
          <span className="loader-letter">g</span>
          <span className="loader-letter">.</span>
          <span className="loader-letter">.</span>
          <span className="loader-letter">.</span>
          <div className="loader-circle" />
        </div>
      </div>
    </StyledLoaderWrapper>
  );
};

const StyledLoaderWrapper = styled.div`
  .loader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 0;
    background: linear-gradient(0deg, #1a3379, #0f172a, #000);
  }

  .loader-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 180px;
    height: 180px;
    font-family: "Inter", sans-serif;
    font-size: 1.1em;
    font-weight: 300;
    color: white;
    border-radius: 50%;
    background-color: transparent;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .loader-circle {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    background-color: transparent;
    animation: loader-combined 2.3s linear infinite;
    z-index: 0;
  }

  @keyframes loader-combined {
    0% {
      transform: rotate(90deg);
      box-shadow:
        0 6px 12px 0 #38bdf8 inset,
        0 12px 18px 0 #005dff inset,
        0 36px 36px 0 #1e40af inset,
        0 0 3px 1.2px rgba(56, 189, 248, 0.3),
        0 0 6px 1.8px rgba(0, 93, 255, 0.2);
    }
    25% {
      transform: rotate(180deg);
      box-shadow:
        0 6px 12px 0 #0099ff inset,
        0 12px 18px 0 #38bdf8 inset,
        0 36px 36px 0 #005dff inset,
        0 0 6px 2.4px rgba(56, 189, 248, 0.3),
        0 0 12px 3.6px rgba(0, 93, 255, 0.2),
        0 0 18px 6px rgba(30, 64, 175, 0.15);
    }
    50% {
      transform: rotate(270deg);
      box-shadow:
        0 6px 12px 0 #60a5fa inset,
        0 12px 6px 0 #0284c7 inset,
        0 24px 36px 0 #005dff inset,
        0 0 3px 1.2px rgba(56, 189, 248, 0.3),
        0 0 6px 1.8px rgba(0, 93, 255, 0.2);
    }
    75% {
      transform: rotate(360deg);
      box-shadow:
        0 6px 12px 0 #3b82f6 inset,
        0 12px 18px 0 #0ea5e9 inset,
        0 36px 36px 0 #2563eb inset,
        0 0 6px 2.4px rgba(56, 189, 248, 0.3),
        0 0 12px 3.6px rgba(0, 93, 255, 0.2),
        0 0 18px 6px rgba(30, 64, 175, 0.15);
    }
    100% {
      transform: rotate(450deg);
      box-shadow:
        0 6px 12px 0 #4dc8fd inset,
        0 12px 18px 0 #005dff inset,
        0 36px 36px 0 #1e40af inset,
        0 0 3px 1.2px rgba(56, 189, 248, 0.3),
        0 0 6px 1.8px rgba(0, 93, 255, 0.2);
    }
  }

  .loader-letter {
    display: inline-block;
    opacity: 0.4;
    transform: translateY(0);
    animation: loader-letter-anim 2.4s infinite;
    z-index: 1;
    border-radius: 50ch;
    border: none;
  }

  .loader-letter:nth-child(1) {
    animation-delay: 0s;
  }
  .loader-letter:nth-child(2) {
    animation-delay: 0.1s;
  }
  .loader-letter:nth-child(3) {
    animation-delay: 0.2s;
  }
  .loader-letter:nth-child(4) {
    animation-delay: 0.3s;
  }
  .loader-letter:nth-child(5) {
    animation-delay: 0.4s;
  }
  .loader-letter:nth-child(6) {
    animation-delay: 0.5s;
  }
  .loader-letter:nth-child(7) {
    animation-delay: 0.6s;
  }
  .loader-letter:nth-child(8) {
    animation-delay: 0.7s;
  }
  .loader-letter:nth-child(9) {
    animation-delay: 0.8s;
  }
  .loader-letter:nth-child(10) {
    animation-delay: 0.9s;
  }

  @keyframes loader-letter-anim {
    0%,
    100% {
      opacity: 0.4;
      transform: translateY(0);
    }
    20% {
      opacity: 1;
      text-shadow: #f8fcff 0 0 5px;
    }
    40% {
      opacity: 0.7;
      transform: translateY(0);
    }
  }
`;

const navLinks = [
  { label: "Home", to: "home" },
  { label: "Structure", to: "section2" },
  { label: "AI Integration", to: "section3" },
  { label: "Limits", to: "section4" },
];

const StyledStatCard = ({ stat }) => {
  return (
    <StyledWrapper>
      <div className="outer">
        <div className="dot" />
        <div className="card">
          <div className="ray" />
          <div className="text">{stat.value}</div>
          <div>{stat.label}</div>
          <div className="line topl" />
          <div className="line leftl" />
          <div className="line bottoml" />
          <div className="line rightl" />
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .outer {
    width: 300px;
    height: 250px;
    border-radius: 10px;
    padding: 1px;
    background: radial-gradient(circle 230px at 0% 0%, #ffffff, #0c0d0d);
    position: relative;
  }

  .dot {
    width: 5px;
    aspect-ratio: 1;
    position: absolute;
    background-color: #fff;
    box-shadow: 0 0 10px #ffffff;
    border-radius: 100px;
    z-index: 2;
    right: 10%;
    top: 10%;
    animation: moveDot 6s linear infinite;
  }

  @keyframes moveDot {
    0%,
    100% {
      top: 10%;
      right: 10%;
    }
    25% {
      top: 10%;
      right: calc(100% - 35px);
    }
    50% {
      top: calc(100% - 30px);
      right: calc(100% - 35px);
    }
    75% {
      top: calc(100% - 30px);
      right: 10%;
    }
  }

  .card {
    z-index: 1;
    width: 100%;
    height: 100%;
    border-radius: 9px;
    border: solid 1px #202222;
    background-size: 20px 20px;
    background: radial-gradient(circle 280px at 0% 0%, #444444, #0c0d0d);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-direction: column;
    color: #fff;
  }
  .ray {
    width: 220px;
    height: 45px;
    border-radius: 100px;
    position: absolute;
    background-color: #c7c7c7;
    opacity: 0.4;
    box-shadow: 0 0 50px #fff;
    filter: blur(10px);
    transform-origin: 10%;
    top: 0%;
    left: 0;
    transform: rotate(40deg);
  }

  .card .text {
    font-weight: bolder;
    font-size: 4rem;
    background: linear-gradient(45deg, #000000 4%, #fff, #000);
    background-clip: text;
    color: transparent;
  }

  .line {
    width: 100%;
    height: 1px;
    position: absolute;
    background-color: #2c2c2c;
  }
  .topl {
    top: 10%;
    background: linear-gradient(90deg, #888888 30%, #1d1f1f 70%);
  }
  .bottoml {
    bottom: 10%;
  }
  .leftl {
    left: 10%;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, #747474 30%, #222424 70%);
  }
  .rightl {
    right: 10%;
    width: 1px;
    height: 100%;
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (sectionId) => {
    let element;
    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    } else if (sectionId === "section2" && section2Ref.current) {
      element = section2Ref.current;
    } else if (sectionId === "section3" && section3Ref.current) {
      element = section3Ref.current;
    } else if (sectionId === "section4" && section4Ref.current) {
      element = section4Ref.current;
    }

    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Video Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          transform: `translateY(${scrollY * 0.3}px) scale(${1 + scrollY / 8000})`,
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover scale-110"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16 py-6"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group"
        >
          <Anchor className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
          <span className="text-sm font-body font-semibold tracking-wider text-foreground/90 group-hover:text-foreground transition-colors">
            INDIAN NAVY
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => scrollToSection(link.to)}
              className="relative text-[13px] font-body font-normal tracking-wide text-foreground/50 hover:text-foreground transition-colors duration-300 py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-foreground/40 hover:after:w-full after:transition-all after:duration-300"
            >
              {link.label}
            </button>
          ))}
        </nav>
      </motion.header>

      {/* Hero Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full px-8 md:px-16 lg:px-24 max-w-6xl flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <p className="text-[11px] font-body font-normal tracking-[0.4em] uppercase text-foreground/40 mb-8">
              Advanced Naval Simulation
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.1, 0, 1] }}
            className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[1.05] tracking-tight text-foreground max-w-3xl"
          >
            A New Class
            <br />
            of Naval
            <br />
            <span className="text-foreground/60">Intelligence.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-8 text-[15px] font-body font-light leading-relaxed text-foreground/40 max-w-2xl"
          >
            Explore ship systems, weapons, and infrastructure through immersive
            3D and simulation technologies.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mt-12 flex items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate("/explorer")}
              className="group flex items-center gap-3 px-7 py-3.5 rounded-full bg-foreground text-background text-[13px] font-body font-medium tracking-wide hover:bg-foreground/90 transition-all duration-300 hover:scale-[1.02]"
            >
              Start Simulation
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/weapons")}
              className="px-7 py-3.5 rounded-full border border-foreground/15 text-foreground/60 text-[13px] font-body font-medium tracking-wide hover:border-foreground/30 hover:text-foreground/80 transition-all duration-300 hover:scale-[1.02]"
            >
              Explore Systems
            </button>
          </motion.div>
        </div>
      </main>

      {/* Bottom bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-0 left-0 right-0 z-10 px-8 md:px-16 py-6 bg-black"
      >
      </motion.div>



      {/* Cinematic Transition Divider */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to-bottom, transparent 0%, rgba(0, 0, 0, 0.5) 100%)",
          opacity: Math.max(0, (scrollY - 400) / 300),
          zIndex: 25,
        }}
      ></motion.div>
      </div>

      {/* Section 2: Elite Market Opportunities */}
    <section ref={section2Ref} className="relative min-h-screen w-full overflow-hidden flex items-center justify-start">
      {/* Video Background */}
      <div 
        className="absolute inset-0 z-0 w-full h-full"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
          }}
        >
          <source src="/videos/hero-bg-2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        className="relative z-10 w-full px-8 md:px-16 lg:px-24 max-w-4xl text-left"
      >
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: false, amount: 0.5 }}
          className="text-[11px] font-body font-normal tracking-[0.4em] uppercase text-accent mb-6"
        >
          Strategic Opportunities
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: false, amount: 0.5 }}
          className="font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-white mb-6"
        >
          Marine Infrastructure
          <span className="text-white/60">. Modernized.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: false, amount: 0.5 }}
          className="text-[15px] font-body font-light leading-relaxed text-white/80 max-w-2xl mb-4"
        >
          Next-generation naval fleet capabilities with integrated systems, advanced targeting solutions, and real-time threat assessment networks.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: false, amount: 0.5 }}
          className="text-[14px] font-body font-light leading-relaxed text-white/70"
        >
          Integrated defense ecosystems, seamlessly.
        </motion.p>
      </motion.div>
    </section>

    {/* Section 3: Capabilities Overview */}
    <section ref={section3Ref} className="relative min-h-screen w-full bg-background flex items-center overflow-hidden py-20">
      {/* Video Background */}
      <div 
        className="absolute inset-0 z-0 w-full h-full"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
          }}
        >
          <source src="/8760caa0-582a50ce.mp4" type="video/mp4" />
        </video>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        className="relative z-10 w-full px-8 md:px-16 lg:px-24 max-w-6xl mx-auto"
      >
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.5 }}
            className="text-[11px] font-body font-normal tracking-[0.4em] uppercase text-accent mb-6"
          >
            Advanced Systems
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: false, amount: 0.5 }}
            className="font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-foreground max-w-3xl mx-auto"
          >
            Artificial Intelligence
            <br />
            & Advanced Technology
          </motion.h2>
        </div>

        {/* Grid of capabilities */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {[
            { label: "Intelligence", description: "Satellite surveillance and tactical analysis systems" },
            { label: "Healthcare", description: "Advanced medical facilities and crew wellness programs" },
            { label: "Biotech", description: "Cutting-edge biological research capabilities" },
            { label: "Next-Gen", description: "Revolutionary propulsion and energy systems" },
            { label: "Defense", description: "Integrated defensive countermeasures" },
            { label: "Cybersecurity", description: "Multi-layer network protection infrastructure" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: false, amount: 0.3 }}
              className="group p-6 rounded-xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 hover:border-foreground/20 transition-all duration-300 cursor-pointer"
            >
              <h3 className="text-lg font-body font-medium text-foreground/80 group-hover:text-foreground transition-colors mb-3">
                {item.label}
              </h3>
              <p className="text-sm font-body font-light text-foreground/60">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* Section 4: Statistics & Impact */}
    <section ref={section4Ref} className="relative min-h-screen w-full bg-black flex items-center overflow-hidden py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        className="w-full px-8 md:px-16 lg:px-24 max-w-6xl mx-auto"
      >
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, amount: 0.5 }}
            className="text-[11px] font-body font-normal tracking-[0.4em] uppercase text-accent mb-6"
          >
            Performance Metrics
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: false, amount: 0.5 }}
            className="font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-white max-w-3xl mx-auto"
          >
            What We've Achieved
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { value: "100%", label: "System Uptime" },
            { value: "+250%", label: "Performance Improvement" },
            { value: "24/7", label: "Real-Time Monitoring" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: false, amount: 0.3 }}
            >
              <StyledStatCard stat={stat} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* Footer */}
    <footer className="relative w-full bg-background/50 border-t border-foreground/5 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: false, amount: 0.5 }}
        className="w-full px-8 md:px-16 lg:px-24 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center"
      >
      </motion.div>
    </footer>
    </>
  );
}
