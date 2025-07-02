import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  StaggerChildren,
  ScaleIn,
  HoverScale,
} from "@/components/animations/AnimatedComponents";
import {
  Bot,
  Users,
  Globe,
  MessageCircle,
  Award,
  Building,
  Clock,
  Heart,
  Lightbulb,
  Shield,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";
import { SignUpButton, SignedOut, SignedIn } from "@clerk/clerk-react";

// Define animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-white via-slate-50 to-violet-50 relative overflow-hidden">
        {/* Background decorative elements */}
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
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FadeInDown>
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100 mb-6">
                <span className="text-sm font-medium text-gray-700">Our Story</span>
              </div>
            </FadeInDown>

            <FadeInUp delay={0.1}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                We're building the future of{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-highlight to-purple-700">
                  customer interactions
                </span>
              </h1>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                ChatBot Agency was founded with a simple mission: to make AI accessible to businesses of all sizes and transform how they connect with their customers.
              </p>
            </FadeInUp>

            <FadeInUp delay={0.3}>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <HoverScale>
                  <Button
                    size="lg"
                    className="rounded-full px-8 py-6 bg-highlight hover:bg-highlight/90 shadow-lg hover:shadow-xl hover:shadow-highlight/20 transition-all duration-200"
                    asChild
                  >
                    <Link to="/contact">Get in Touch</Link>
                  </Button>
                </HoverScale>
                <HoverScale>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 py-6 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    asChild
                  >
                    <Link to="#team">Meet Our Team</Link>
                  </Button>
                </HoverScale>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInLeft>
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-highlight/10 rounded-full"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-500/10 rounded-full"></div>
                <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                    alt="Our team collaborating"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </FadeInLeft>

            <FadeInRight>
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-highlight/10 px-4 py-1.5 rounded-full">
                  <span className="text-sm font-medium text-highlight">Our Journey</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">From startup to industry leader</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Founded in 2018, ChatBot Agency began with a small team of AI enthusiasts who believed in the power of conversational AI to transform businesses. What started as a simple chatbot builder has evolved into a comprehensive platform used by thousands of companies worldwide.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Our journey hasn't been without challenges, but our commitment to innovation and customer success has driven us forward. Today, we're proud to be at the forefront of AI-powered customer engagement solutions.
                </p>
                <div className="pt-4 grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold text-highlight">5000+</span>
                    <span className="text-gray-500">Active Customers</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold text-highlight">30+</span>
                    <span className="text-gray-500">Countries Served</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold text-highlight">$25M+</span>
                    <span className="text-gray-500">Funding Raised</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold text-highlight">120+</span>
                    <span className="text-gray-500">Team Members</span>
                  </div>
                </div>
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <FadeInUp>
              <div className="inline-flex items-center space-x-2 bg-highlight/10 px-4 py-1.5 rounded-full mb-4">
                <span className="text-sm font-medium text-highlight">Our Values</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">The principles that guide us</h2>
              <p className="text-lg text-gray-600">
                Our values shape everything we do, from how we build our products to how we interact with our customers and each other.
              </p>
            </FadeInUp>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: <Lightbulb className="h-6 w-6 text-highlight" />,
                title: "Innovation",
                description:
                  "We constantly push the boundaries of what's possible with AI and conversational interfaces.",
              },
              {
                icon: <Users className="h-6 w-6 text-highlight" />,
                title: "Customer Focus",
                description:
                  "Our customers' success is our success. We listen, learn, and deliver solutions that create real value.",
              },
              {
                icon: <Shield className="h-6 w-6 text-highlight" />,
                title: "Integrity",
                description:
                  "We're committed to ethical AI practices and being transparent in everything we do.",
              },
              {
                icon: <Zap className="h-6 w-6 text-highlight" />,
                title: "Excellence",
                description:
                  "We strive for excellence in our products, our service, and our workplace culture.",
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <div className="w-12 h-12 rounded-full bg-highlight/10 flex items-center justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <FadeInUp>
              <div className="inline-flex items-center space-x-2 bg-highlight/10 px-4 py-1.5 rounded-full mb-4">
                <span className="text-sm font-medium text-highlight">Our Team</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Meet the people behind ChatBot Agency</h2>
              <p className="text-lg text-gray-600">
                Our diverse team of experts is passionate about AI and dedicated to helping businesses succeed.
              </p>
            </FadeInUp>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                name: "Sarah Johnson",
                role: "CEO & Co-Founder",
                image: "https://randomuser.me/api/portraits/women/44.jpg",
                bio: "Former AI research lead with 15+ years of experience in machine learning and natural language processing.",
              },
              {
                name: "Michael Chen",
                role: "CTO & Co-Founder",
                image: "https://randomuser.me/api/portraits/men/32.jpg",
                bio: "Software architect and AI specialist who previously built conversational systems at Google.",
              },
              {
                name: "Elena Rodriguez",
                role: "Chief Product Officer",
                image: "https://randomuser.me/api/portraits/women/68.jpg",
                bio: "Product visionary with a background in UX design and customer experience optimization.",
              },
              {
                name: "James Wilson",
                role: "VP of Engineering",
                image: "https://randomuser.me/api/portraits/men/46.jpg",
                bio: "Engineering leader who specializes in building scalable AI systems and robust infrastructure.",
              },
              {
                name: "Priya Patel",
                role: "Head of Customer Success",
                image: "https://randomuser.me/api/portraits/women/26.jpg",
                bio: "Customer advocate focused on ensuring clients get maximum value from our platform.",
              },
              {
                name: "David Kim",
                role: "Lead AI Researcher",
                image: "https://randomuser.me/api/portraits/men/22.jpg",
                bio: "PhD in computational linguistics with multiple published papers on conversational AI.",
              },
              {
                name: "Olivia Martinez",
                role: "VP of Marketing",
                image: "https://randomuser.me/api/portraits/women/17.jpg",
                bio: "Marketing strategist with experience scaling B2B SaaS companies from startup to enterprise.",
              },
              {
                name: "Thomas Wright",
                role: "VP of Sales",
                image: "https://randomuser.me/api/portraits/men/55.jpg",
                bio: "Sales leader with a track record of building high-performing teams in the AI and automation space.",
              },
            ].map((member, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                variants={fadeInUp}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <div className="h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-highlight font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-16">
            <FadeInUp>
              <p className="text-lg text-gray-600 mb-8">
                Interested in joining our team? We're always looking for talented individuals who share our passion.
              </p>
              <Button
                className="rounded-full px-8 py-6 bg-highlight hover:bg-highlight/90 shadow-lg hover:shadow-xl hover:shadow-highlight/20 transition-all duration-200"
                asChild
              >
                <Link to="/careers">View Open Positions</Link>
              </Button>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-brand-dark text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-highlight rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <FadeInUp>
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                <span className="text-sm font-medium text-white">Our Journey</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Key milestones along the way</h2>
              <p className="text-lg text-gray-300">
                From our humble beginnings to where we are today, these are the moments that defined our journey.
              </p>
            </FadeInUp>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {[
                {
                  year: "2018",
                  title: "Company Founded",
                  description:
                    "ChatBot Agency was founded by Sarah Johnson and Michael Chen with a vision to democratize AI for businesses.",
                },
                {
                  year: "2019",
                  title: "First Major Client",
                  description:
                    "Secured our first enterprise client, a Fortune 500 retail company, validating our approach to conversational AI.",
                },
                {
                  year: "2020",
                  title: "Series A Funding",
                  description:
                    "Raised $8M in Series A funding to accelerate product development and expand our team.",
                },
                {
                  year: "2021",
                  title: "Platform Expansion",
                  description:
                    "Launched our enterprise platform with advanced analytics and integration capabilities.",
                },
                {
                  year: "2022",
                  title: "International Expansion",
                  description:
                    "Opened offices in London and Singapore, expanding our global presence and customer base.",
                },
                {
                  year: "2023",
                  title: "Series B Funding",
                  description:
                    "Secured $17M in Series B funding to further accelerate growth and innovation.",
                },
              ].map((milestone, index) => (
                <FadeInUp key={index} delay={index * 0.1}>
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0 w-24 pt-1">
                      <div className="text-2xl font-bold text-highlight">{milestone.year}</div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-3 h-3 rounded-full bg-highlight"></div>
                        <h3 className="text-xl font-bold text-white">{milestone.title}</h3>
                      </div>
                      <p className="text-gray-300 pl-6">{milestone.description}</p>
                    </div>
                  </div>
                </FadeInUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <FadeInUp>
              <div className="inline-flex items-center space-x-2 bg-highlight/10 px-4 py-1.5 rounded-full mb-4">
                <span className="text-sm font-medium text-highlight">Our Offices</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Where to find us</h2>
              <p className="text-lg text-gray-600">
                With offices around the world, we're building a global community of AI innovators.
              </p>
            </FadeInUp>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                city: "San Francisco",
                country: "United States",
                image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80",
                address: "525 Market St, Suite 2000, San Francisco, CA 94105",
              },
              {
                city: "London",
                country: "United Kingdom",
                image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
                address: "10 Finsbury Square, London, EC2A 1AF",
              },
              {
                city: "Singapore",
                country: "Singapore",
                image: "https://images.unsplash.com/photo-1565967511849-76a60a516170?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80",
                address: "80 Robinson Rd, #08-01, Singapore 068898",
              },
            ].map((office, index) => (
              <motion.div
                key={index}
                className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                variants={fadeInUp}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={office.image}
                    alt={office.city}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{office.city}</h3>
                  <p className="text-highlight font-medium mb-3">{office.country}</p>
                  <p className="text-gray-600 text-sm">{office.address}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-highlight to-purple-700 text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FadeInUp>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your customer experience?</h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                Join thousands of businesses already using our AI chatbot platform to deliver exceptional customer service.
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
                  asChild
                >
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
