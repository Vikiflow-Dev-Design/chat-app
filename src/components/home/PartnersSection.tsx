import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  FadeIn,
  FadeInUp,
  StaggerChildren,
} from "@/components/animations/AnimatedComponents";

// Updated with more professional company names and actual logo paths
const partners = [
  {
    name: "Microsoft",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png",
  },
  {
    name: "Salesforce",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/512px-Salesforce.com_logo.svg.png",
  },
  {
    name: "Adobe",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Adobe_Corporate_logo.png/512px-Adobe_Corporate_logo.png",
  },
  {
    name: "IBM",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/512px-IBM_logo.svg.png",
  },
  {
    name: "Oracle",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/512px-Oracle_logo.svg.png",
  },
  {
    name: "SAP",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/512px-SAP_2011_logo.svg.png",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const PartnersSection = () => {
  return (
    <section className="py-16 border-t border-gray-100">
      <div className="container mx-auto px-6">
        <FadeInUp>
          <div className="text-center mb-10">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium mb-1">
              Trusted by leading companies
            </p>
            <h3 className="text-2xl font-semibold text-gray-800">
              Join thousands of businesses using our platform
            </h3>
          </div>
        </FadeInUp>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              className="grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300 transform hover:scale-105"
              variants={itemVariants}
              whileHover={{
                scale: 1.1,
                grayscale: 0,
                opacity: 1,
                transition: { duration: 0.2 },
              }}
            >
              <Card className="bg-transparent border-0 shadow-none w-full h-full">
                <CardContent className="p-4 flex items-center justify-center h-16">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-10 max-w-[120px] object-contain"
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <FadeIn delay={0.6}>
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              These companies have experienced significant improvements in
              customer satisfaction and operational efficiency with our AI
              chatbot solutions.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default PartnersSection;
