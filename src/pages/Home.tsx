import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import {
  ArrowRight,
  Bot,
  CheckCircle,
  Globe,
  MessageCircle,
  Users,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import HeroImage from "@/components/home/HeroImage";
import Testimonials from "@/components/home/Testimonials";
import FeatureSection from "@/components/home/FeatureSection";
import StatsSection from "@/components/home/StatsSection";
import PartnersSection from "@/components/home/PartnersSection";
import { useState, useEffect } from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  StaggerChildren,
  ScaleIn,
  HoverScale,
  HoverElevate,
} from "@/components/animations/AnimatedComponents";
import { FloatingChatWidget } from "@/components/chat/FloatingChatWidget";

// Define the fadeInUp variant that's used in the StaggerChildren component
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-highlight z-50"
        style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
      />

      {/* Navigation - Modern Design */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-5 px-6">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-highlight to-purple-600 p-2 rounded-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              ChatBot Agency
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-highlight transition-colors"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-gray-700 hover:text-highlight transition-colors"
            >
              About
            </Link>
            <div className="relative group">
              <button className="flex items-center text-sm font-medium text-gray-700 hover:text-highlight transition-colors">
                Solutions <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                <div className="py-2">
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Customer Service
                  </Link>
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sales & Marketing
                  </Link>
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    E-commerce
                  </Link>
                </div>
              </div>
            </div>
            <Link
              to="#features"
              className="text-sm font-medium text-gray-700 hover:text-highlight transition-colors"
            >
              Features
            </Link>
            <Link
              to="#pricing"
              className="text-sm font-medium text-gray-700 hover:text-highlight transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="#testimonials"
              className="text-sm font-medium text-gray-700 hover:text-highlight transition-colors"
            >
              Testimonials
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <SignedIn>
              <Button
                asChild
                className="rounded-full px-6 bg-highlight hover:bg-highlight/90 transition-all duration-200"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  className="rounded-full px-6 text-gray-700 hover:text-highlight hover:bg-gray-50 transition-all duration-200"
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="rounded-full px-6 bg-highlight hover:bg-highlight/90 transition-all duration-200">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-highlight transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-6">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-base font-medium text-gray-700 hover:text-highlight transition-colors"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-base font-medium text-gray-700 hover:text-highlight transition-colors"
              >
                About
              </Link>
              <Link
                to="#"
                className="text-base font-medium text-gray-700 hover:text-highlight transition-colors"
              >
                Solutions
              </Link>
              <Link
                to="#features"
                className="text-base font-medium text-gray-700 hover:text-highlight transition-colors"
              >
                Features
              </Link>
              <Link
                to="#pricing"
                className="text-base font-medium text-gray-700 hover:text-highlight transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="#testimonials"
                className="text-base font-medium text-gray-700 hover:text-highlight transition-colors"
              >
                Testimonials
              </Link>

              <div className="pt-4 border-t border-gray-100">
                <SignedIn>
                  <Button
                    asChild
                    className="w-full rounded-full bg-highlight hover:bg-highlight/90 transition-all duration-200"
                  >
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                </SignedIn>
                <SignedOut>
                  <div className="flex flex-col space-y-3">
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full rounded-full">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full rounded-full bg-highlight hover:bg-highlight/90 transition-all duration-200">
                        Get Started
                      </Button>
                    </SignUpButton>
                  </div>
                </SignedOut>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Enhanced Design with Animations */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-white via-slate-50 to-violet-50 relative overflow-hidden">
        {/* Background decorative elements with animations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-24 -right-24 w-96 h-96 bg-highlight/5 rounded-full blur-3xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          ></motion.div>
          <motion.div
            className="absolute top-1/2 -left-24 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          ></motion.div>
          <motion.div
            className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-full h-64 bg-gradient-to-r from-highlight/10 to-purple-500/10 rounded-full blur-3xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
          ></motion.div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <FadeInDown delay={0.1}>
                <motion.div
                  className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100"
                  whileHover={{
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-highlight" />
                  </motion.div>
                  <span className="text-sm font-medium text-gray-700">
                    Next-generation AI chatbots
                  </span>
                </motion.div>
              </FadeInDown>

              <FadeInUp delay={0.2}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <motion.span
                    className="bg-clip-text text-transparent bg-gradient-to-r from-highlight to-purple-700"
                    initial={{ backgroundPosition: "0% 50%" }}
                    animate={{ backgroundPosition: "100% 50%" }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    AI-powered
                  </motion.span>{" "}
                  chatbots for modern businesses
                </h1>
              </FadeInUp>

              <FadeInUp delay={0.3}>
                <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                  Build, customize, and deploy AI chatbots that transform your
                  customer service experience. No coding required.
                </p>
              </FadeInUp>

              <FadeInUp delay={0.4}>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-2">
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <HoverScale>
                        <Button
                          size="lg"
                          className="w-full sm:w-auto rounded-full px-8 py-6 bg-highlight hover:bg-highlight/90 shadow-lg hover:shadow-xl hover:shadow-highlight/20 transition-all duration-200"
                        >
                          Start Building <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </HoverScale>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <HoverScale>
                      <Button
                        size="lg"
                        className="w-full sm:w-auto rounded-full px-8 py-6 bg-highlight hover:bg-highlight/90 shadow-lg hover:shadow-xl hover:shadow-highlight/20 transition-all duration-200"
                        asChild
                      >
                        <Link to="/dashboard">
                          Go to Dashboard{" "}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </HoverScale>
                  </SignedIn>
                  <HoverScale>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto rounded-full px-8 py-6 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    >
                      View Demo
                    </Button>
                  </HoverScale>
                </div>
              </FadeInUp>

              <FadeInUp delay={0.5}>
                <div className="pt-6 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
                  <StaggerChildren>
                    <motion.div
                      className="flex items-center space-x-2"
                      variants={fadeInUp}
                    >
                      <motion.div
                        className="bg-green-100 rounded-full p-1"
                        whileHover={{ scale: 1.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <CheckCircle className="text-green-500 h-4 w-4" />
                      </motion.div>
                      <span className="text-sm text-slate-700">
                        No credit card required
                      </span>
                    </motion.div>
                    <motion.div
                      className="flex items-center space-x-2"
                      variants={fadeInUp}
                    >
                      <motion.div
                        className="bg-green-100 rounded-full p-1"
                        whileHover={{ scale: 1.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <CheckCircle className="text-green-500 h-4 w-4" />
                      </motion.div>
                      <span className="text-sm text-slate-700">
                        Free 14-day trial
                      </span>
                    </motion.div>
                    <motion.div
                      className="flex items-center space-x-2"
                      variants={fadeInUp}
                    >
                      <motion.div
                        className="bg-green-100 rounded-full p-1"
                        whileHover={{ scale: 1.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <CheckCircle className="text-green-500 h-4 w-4" />
                      </motion.div>
                      <span className="text-sm text-slate-700">
                        Cancel anytime
                      </span>
                    </motion.div>
                  </StaggerChildren>
                </div>
              </FadeInUp>
            </div>
            <FadeInRight delay={0.3} className="lg:w-1/2">
              <HeroImage />
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <PartnersSection />

      {/* Features Section - Enhanced */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-highlight/10 rounded-full mb-4">
              <span className="text-sm font-medium text-highlight">
                Powerful Features
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Why businesses choose our platform
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Our AI-powered chatbot platform delivers exceptional customer
              experiences with powerful features designed for modern businesses.
            </p>
          </div>

          <FeatureSection />
        </div>
      </section>

      {/* Statistics Section */}
      <StatsSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-highlight/10 rounded-full mb-4">
              <span className="text-sm font-medium text-highlight">
                Flexible Pricing
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Choose the perfect plan for your business
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Whether you're a small business or enterprise, we have a plan that
              fits your needs and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-gray-500 mb-4">
                  Perfect for small businesses
                </p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">1 AI chatbot</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">5,000 messages/month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Website integration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Basic analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Email support</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 border-t border-gray-100">
                <Button className="w-full rounded-full bg-highlight hover:bg-highlight/90">
                  Get Started
                </Button>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="border-2 border-highlight rounded-2xl overflow-hidden shadow-xl shadow-highlight/10 transform hover:-translate-y-1 transition-all duration-300 relative">
              <div className="absolute top-0 inset-x-0 bg-highlight text-white text-xs font-bold text-center py-1">
                MOST POPULAR
              </div>
              <div className="p-8 border-b border-gray-100 mt-6">
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <p className="text-gray-500 mb-4">
                  Ideal for growing businesses
                </p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">3 AI chatbots</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">25,000 messages/month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">
                      Website & mobile integration
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Custom knowledge base</span>
                  </li>
                </ul>
              </div>
              <div className="p-8 border-t border-gray-100">
                <Button className="w-full rounded-full bg-highlight hover:bg-highlight/90 shadow-lg hover:shadow-xl hover:shadow-highlight/20 transition-all duration-200">
                  Get Started
                </Button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-500 mb-4">For large organizations</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Unlimited chatbots</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Unlimited messages</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">All integrations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Enterprise analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">
                      Dedicated account manager
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Custom development</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 border-t border-gray-100">
                <Button variant="outline" className="w-full rounded-full">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Enhanced */}
      <section
        id="testimonials"
        className="py-24 bg-gradient-to-br from-white via-slate-50 to-violet-50 relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-highlight/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-24 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-full h-64 bg-gradient-to-r from-highlight/10 to-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-highlight/10 rounded-full mb-4">
              <span className="text-sm font-medium text-highlight">
                Customer Stories
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Trusted by innovative teams worldwide
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See what our customers are saying about their experience with our
              AI chatbot platform.
            </p>
          </div>

          <Testimonials />
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-highlight to-purple-700 text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your customer experience?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Join thousands of businesses already using our AI chatbot platform
              to deliver exceptional customer service.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-full px-8 py-6 bg-white text-highlight hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Get Started for Free
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-8 py-6 bg-white text-highlight hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
                  asChild
                >
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </SignedIn>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full px-8 py-6 border-white text-white hover:bg-white/10 transition-all duration-200"
              >
                Schedule a Demo
              </Button>
            </div>
            <p className="mt-8 text-white/70">
              No credit card required. 14-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-gray-900 py-16 text-white/70">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-highlight to-purple-600 p-2 rounded-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  ChatBot Agency
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Building the future of AI-powered customer interactions with
                advanced chatbot technology that transforms how businesses
                connect with their customers.
              </p>
              <div className="flex space-x-5">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Globe className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Users className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white text-lg mb-6">Product</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Integrations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Enterprise
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white text-lg mb-6">
                Resources
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Guides
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white text-lg mb-6">Company</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Legal
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} ChatBot Agency. All rights
              reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="#"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cookies
              </a>
              <a
                href="#"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget */}
      <FloatingChatWidget chatbotId="680f30a804738d2e3ec70420" />
    </div>
  );
};

export default Home;
