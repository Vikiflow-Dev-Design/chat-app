import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";
import {
  Bot,
  Send,
  Sparkles,
  BarChart3,
  Clock,
  Users,
  ThumbsUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Animation variants
const chatContainerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  },
};

const messageVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

const userMessageVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

const floatingCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.5 + custom * 0.2,
      duration: 0.5,
      type: "spring",
      stiffness: 200,
    },
  }),
  hover: {
    y: -5,
    rotate: 0,
    transition: { duration: 0.2 },
  },
};

const HeroImage = () => {
  // State for typing animation
  const [typingText, setTypingText] = useState("");
  const fullText =
    "Great question! We offer seamless integrations with all major e-commerce platforms including Shopify, WooCommerce, and Magento. Our AI chatbots can:";

  // Typing animation effect
  useEffect(() => {
    if (typingText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypingText(fullText.slice(0, typingText.length + 1));
      }, 30);

      return () => clearTimeout(timeout);
    }
  }, [typingText]);

  return (
    <div className="relative">
      {/* Main chatbot interface mockup - enhanced design with animations */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="shadow-2xl rounded-2xl overflow-hidden border-0 bg-white transform transition-all duration-500 hover:shadow-highlight/20 hover:-translate-y-1">
          <AspectRatio ratio={16 / 9}>
            <div className="absolute inset-0 p-6">
              <motion.div
                className="h-full flex flex-col rounded-xl overflow-hidden border border-gray-100 shadow-sm"
                variants={chatContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Chat header */}
                <div className="bg-white border-b border-gray-100 py-4 px-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-highlight to-purple-600 flex items-center justify-center text-white"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.3,
                      }}
                    >
                      <Bot className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        ChatBot Assistant
                      </p>
                      <div className="flex items-center">
                        <motion.span
                          className="w-2 h-2 bg-green-500 rounded-full mr-2"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "loop",
                          }}
                        ></motion.span>
                        <span className="text-xs text-gray-500">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Chat body */}
                <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6">
                  {/* Welcome message */}
                  <motion.div
                    className="flex items-start space-x-3 max-w-[85%]"
                    variants={messageVariants}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-highlight to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                    <motion.div
                      className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100"
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    >
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Hello! 👋 Welcome to ChatBot Agency. How can I assist
                        you with your customer service needs today?
                      </p>
                    </motion.div>
                  </motion.div>

                  {/* User message */}
                  <motion.div
                    className="flex items-start justify-end space-x-3 max-w-[85%] ml-auto"
                    variants={userMessageVariants}
                  >
                    <motion.div
                      className="bg-highlight/10 rounded-2xl rounded-tr-none p-4"
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 1.0, duration: 0.3 }}
                    >
                      <p className="text-sm text-gray-800">
                        I'm looking for an AI chatbot solution that can
                        integrate with our e-commerce platform. What options do
                        you offer?
                      </p>
                    </motion.div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 text-xs">
                      U
                    </div>
                  </motion.div>

                  {/* Bot message with typing animation */}
                  <motion.div
                    className="flex items-start space-x-3 max-w-[85%]"
                    variants={messageVariants}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-highlight to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                    <motion.div
                      className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100"
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 1.5, duration: 0.3 }}
                    >
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {typingText}
                        {typingText.length < fullText.length && (
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-block w-2 h-4 bg-gray-400 ml-1"
                          />
                        )}
                      </p>
                      {typingText.length === fullText.length && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                        >
                          <ul className="mt-2 space-y-1 text-sm text-gray-700 pl-4 list-disc">
                            <motion.li
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6, duration: 0.3 }}
                            >
                              Provide product recommendations based on customer
                              behavior
                            </motion.li>
                            <motion.li
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.8, duration: 0.3 }}
                            >
                              Answer FAQs about products, shipping, and returns
                            </motion.li>
                            <motion.li
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.0, duration: 0.3 }}
                            >
                              Help customers track their orders in real-time
                            </motion.li>
                            <motion.li
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.2, duration: 0.3 }}
                            >
                              Assist with checkout process to reduce cart
                              abandonment
                            </motion.li>
                          </ul>
                          <motion.p
                            className="mt-2 text-sm text-gray-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4, duration: 0.3 }}
                          >
                            Would you like to see a demo of how this works with
                            your specific platform?
                          </motion.p>
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </div>

                {/* Chat input */}
                <div className="bg-white border-t border-gray-100 p-4">
                  <motion.div
                    className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-highlight focus-within:ring-1 focus-within:ring-highlight/30 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                  >
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-2 outline-none"
                      placeholder="Type your message..."
                    />
                    <motion.button
                      className="ml-2 bg-gradient-to-r from-highlight to-purple-600 text-white rounded-full p-2 shadow-md hover:shadow-lg transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Send className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </AspectRatio>
        </Card>
      </motion.div>

      {/* Background decoration - enhanced with animations */}
      <motion.div
        className="absolute -z-10 -bottom-8 -right-8 w-full h-full bg-gradient-to-tr from-highlight/20 to-purple-400/20 rounded-2xl blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      ></motion.div>
      <motion.div
        className="absolute -z-10 -top-8 -left-8 w-full h-full bg-gradient-to-bl from-blue-400/10 to-teal-400/10 rounded-2xl blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      ></motion.div>

      {/* Floating stats cards - enhanced with animations */}
      <motion.div
        className="absolute -top-8 -right-6"
        variants={floatingCardVariants}
        custom={0}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card className="bg-white shadow-xl p-4 rounded-xl max-w-xs border-0 transform rotate-2 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"
              whileHover={{ rotate: 10 }}
            >
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </motion.div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Customer satisfaction
              </p>
              <p className="font-bold text-xl">
                98.5%{" "}
                <motion.span
                  className="text-green-500 text-sm"
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                >
                  ↑4.2%
                </motion.span>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-6"
        variants={floatingCardVariants}
        custom={1}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card className="bg-white shadow-xl p-4 rounded-xl max-w-xs border-0 transform -rotate-2 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"
              whileHover={{ rotate: 10 }}
            >
              <Clock className="h-6 w-6 text-blue-600" />
            </motion.div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Response time
              </p>
              <p className="font-bold text-xl">
                0.7s{" "}
                <motion.span
                  className="text-green-500 text-sm"
                  animate={{ y: [0, 3, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                >
                  ↓0.3s
                </motion.span>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        className="absolute top-1/2 -right-12 transform -translate-y-1/2 hidden lg:block"
        variants={floatingCardVariants}
        custom={2}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card className="bg-white shadow-xl p-4 rounded-xl max-w-xs border-0 rotate-3 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center"
              whileHover={{ rotate: 10 }}
            >
              <Users className="h-6 w-6 text-purple-600" />
            </motion.div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Active users
              </p>
              <p className="font-bold text-xl">
                12.8k{" "}
                <motion.span
                  className="text-green-500 text-sm"
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                >
                  ↑18%
                </motion.span>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default HeroImage;
