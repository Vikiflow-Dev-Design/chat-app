import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bot,
  Globe,
  MessageCircle,
  Users,
  Zap,
  BarChart3,
  Lock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FadeIn,
  FadeInUp,
  StaggerChildren,
  HoverScale,
} from "@/components/animations/AnimatedComponents";

// Enhanced features with more detailed descriptions and additional features
const features = [
  {
    icon: <Bot className="h-8 w-8 text-white" />,
    title: "AI-powered conversations",
    description:
      "Our advanced language models provide human-like interactions that understand context and respond intelligently to customer inquiries.",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: <Globe className="h-8 w-8 text-white" />,
    title: "Multi-channel deployment",
    description:
      "Deploy your chatbots across your website, mobile app, and popular messaging platforms for consistent customer experiences.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-white" />,
    title: "Custom knowledge base",
    description:
      "Train your chatbot with your company's unique information to provide accurate and specific responses to customer questions.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: <Users className="h-8 w-8 text-white" />,
    title: "Human handoff",
    description:
      "Seamlessly transfer complex conversations to human agents when needed with complete context preservation and history.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: <Zap className="h-8 w-8 text-white" />,
    title: "Real-time analytics",
    description:
      "Monitor chatbot performance, user satisfaction, and conversation metrics with our comprehensive analytics dashboard.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-white" />,
    title: "Conversion optimization",
    description:
      "Increase sales and conversions with intelligent product recommendations and personalized customer interactions.",
    color: "from-red-500 to-pink-600",
  },
  {
    icon: <Lock className="h-8 w-8 text-white" />,
    title: "Enterprise security",
    description:
      "Rest easy with SOC 2 compliance, end-to-end encryption, and advanced data protection for all your customer interactions.",
    color: "from-slate-700 to-slate-900",
  },
  {
    icon: <Layers className="h-8 w-8 text-white" />,
    title: "Seamless integrations",
    description:
      "Connect your chatbot with your existing tools including CRM, help desk, and e-commerce platforms with our pre-built integrations.",
    color: "from-violet-500 to-purple-700",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
      duration: 0.5,
    },
  },
};

const iconAnimation = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.3,
    },
  },
};

const FeatureSection = () => {
  return (
    <div className="space-y-16">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {features.slice(0, 4).map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{
              y: -10,
              transition: { duration: 0.2 },
            }}
          >
            <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
              <CardHeader className="pb-2">
                <motion.div
                  className={`mb-6 w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center`}
                  variants={iconAnimation}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.2 },
                  }}
                >
                  {feature.icon}
                </motion.div>
                <CardTitle className="text-xl font-bold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Second row of features with different styling */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {features.slice(4).map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{
              y: -10,
              transition: { duration: 0.2 },
            }}
          >
            <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
              <CardHeader className="pb-2">
                <motion.div
                  className={`mb-6 w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center`}
                  variants={iconAnimation}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.2 },
                  }}
                >
                  {feature.icon}
                </motion.div>
                <CardTitle className="text-xl font-bold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Call to action within features section */}
      <FadeInUp delay={0.4}>
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to experience these features?
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Start building your AI chatbot today and transform your customer
            experience with our powerful platform.
          </p>
          <HoverScale>
            <Button
              asChild
              className="rounded-full px-8 py-6 bg-highlight hover:bg-highlight/90 shadow-lg hover:shadow-xl hover:shadow-highlight/20 transition-all duration-200"
            >
              <Link to="#pricing">View pricing plans</Link>
            </Button>
          </HoverScale>
        </div>
      </FadeInUp>
    </div>
  );
};

export default FeatureSection;
