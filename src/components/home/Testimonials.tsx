import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import {
  FadeIn,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  StaggerChildren,
} from "@/components/animations/AnimatedComponents";

// Enhanced testimonials with real profile images and more professional content
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Customer Support Manager",
    company: "Acme Corporation",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    content:
      "Since implementing this chatbot solution, our response time has decreased by 80% and customer satisfaction has increased by 40%. The AI capabilities are remarkable and the ROI has been substantial for our business.",
    rating: 5,
    logoColor: "bg-blue-100",
  },
  {
    name: "Michael Chen",
    role: "Digital Transformation Lead",
    company: "TechVision Global",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    content:
      "Incredibly easy to customize and integrate with our existing systems. Our team was able to launch our first AI chatbot in less than a day. The platform's flexibility has allowed us to scale our customer service operations efficiently.",
    rating: 5,
    logoColor: "bg-green-100",
  },
  {
    name: "Elena Rodriguez",
    role: "E-commerce Director",
    company: "StyleTrends",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    content:
      "Our sales conversion rate has improved by 25% since adding the chatbot to our website. It handles product recommendations exceptionally well and has significantly reduced cart abandonment rates.",
    rating: 5,
    logoColor: "bg-purple-100",
  },
  {
    name: "James Wilson",
    role: "CTO",
    company: "Innovate Financial",
    image: "https://randomuser.me/api/portraits/men/46.jpg",
    content:
      "The enterprise-grade security features gave us the confidence to deploy this solution in our highly regulated industry. The chatbot has transformed how we handle customer inquiries while maintaining compliance.",
    rating: 5,
    logoColor: "bg-amber-100",
  },
  {
    name: "Priya Patel",
    role: "Head of Customer Experience",
    company: "Global Retail Solutions",
    image: "https://randomuser.me/api/portraits/women/26.jpg",
    content:
      "We've seen a 35% reduction in support tickets and a dramatic improvement in first-contact resolution rates. Our customers love the instant responses and our team can focus on more complex issues.",
    rating: 5,
    logoColor: "bg-red-100",
  },
];

// Animation variants
const quoteIconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.5,
    },
  },
};

const starVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.3 + i * 0.1,
      duration: 0.4,
      type: "spring",
      stiffness: 200,
    },
  }),
};

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2 + i * 0.1,
      duration: 0.5,
    },
  }),
};

const Testimonials = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Featured testimonial */}
      <FadeIn>
        <div className="mb-12">
          <Card className="border border-gray-100 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image column */}
                <FadeInLeft className="bg-gradient-to-br from-highlight to-purple-700 p-8 flex items-center justify-center">
                  <div className="relative">
                    <motion.div
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2,
                      }}
                    >
                      <img
                        src={testimonials[0].image}
                        alt={testimonials[0].name}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    <motion.div
                      className="absolute -top-2 -left-2"
                      variants={quoteIconVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Quote className="h-10 w-10 text-white bg-highlight rounded-full p-2" />
                    </motion.div>
                  </div>
                </FadeInLeft>

                {/* Content column */}
                <FadeInRight className="p-8 flex flex-col justify-center">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        custom={i}
                        variants={starVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      </motion.div>
                    ))}
                  </div>

                  <motion.p
                    className="text-lg text-gray-700 italic mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    "{testimonials[0].content}"
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <p className="font-bold text-gray-900">
                      {testimonials[0].name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {testimonials[0].role}, {testimonials[0].company}
                    </p>
                  </motion.div>
                </FadeInRight>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Carousel of additional testimonials */}
      <FadeInUp delay={0.3}>
        <Carousel className="mx-auto">
          <CarouselContent>
            {testimonials.slice(1).map((testimonial, index) => (
              <CarouselItem
                key={index}
                className="md:basis-1/2 lg:basis-1/3 p-1"
              >
                <motion.div
                  whileHover={{
                    y: -10,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Card className="h-full border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      {/* Company logo placeholder */}
                      <motion.div
                        className={`w-12 h-12 rounded-full ${testimonial.logoColor} flex items-center justify-center mb-4`}
                        whileHover={{
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 },
                        }}
                      >
                        <span className="font-bold text-lg">
                          {testimonial.company.charAt(0)}
                        </span>
                      </motion.div>

                      {/* Rating */}
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                i < testimonial.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          </motion.div>
                        ))}
                      </div>

                      {/* Content */}
                      <p className="text-gray-700 flex-grow mb-6 text-sm italic">
                        "{testimonial.content}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center mt-4 border-t pt-4">
                        <motion.div
                          className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                        <div className="ml-3">
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-xs text-gray-500">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-8">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <CarouselPrevious className="relative inset-0 translate-y-0 h-10 w-10 rounded-full border border-gray-200" />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <CarouselNext className="relative inset-0 translate-y-0 h-10 w-10 rounded-full border border-gray-200" />
            </motion.div>
          </div>
        </Carousel>
      </FadeInUp>

      {/* Testimonial stats */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { value: "500+", label: "Happy Customers" },
          { value: "98%", label: "Satisfaction Rate" },
          { value: "24/7", label: "Customer Support" },
          { value: "30+", label: "Industries Served" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            custom={index}
            variants={statsVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{
              y: -5,
              transition: { duration: 0.2 },
            }}
          >
            <motion.p
              className="text-3xl font-bold text-highlight"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.3 + index * 0.1,
                duration: 0.5,
                type: "spring",
                stiffness: 200,
              }}
              viewport={{ once: true }}
            >
              {stat.value}
            </motion.p>
            <p className="text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
