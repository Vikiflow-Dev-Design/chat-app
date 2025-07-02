import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  TrendingUp,
  Headphones,
  DollarSign,
  Users,
  BarChart,
  Award,
  Zap,
} from "lucide-react";

// Enhanced stats with icons and more detailed information
const statsData = [
  {
    value: "95%",
    label: "Customer retention rate",
    description: "Businesses using our platform retain more customers",
    icon: <Users className="h-6 w-6 text-highlight" />,
  },
  {
    value: "3x",
    label: "Faster response times",
    description: "Immediate responses to customer inquiries",
    icon: <Zap className="h-6 w-6 text-highlight" />,
  },
  {
    value: "24/7",
    label: "Availability",
    description: "Round-the-clock customer support",
    icon: <Clock className="h-6 w-6 text-highlight" />,
  },
  {
    value: "60%",
    label: "Cost reduction",
    description: "Lower customer service operational costs",
    icon: <DollarSign className="h-6 w-6 text-highlight" />,
  },
];

// Additional stats for the expanded section
const additionalStats = [
  {
    value: "85%",
    label: "Increased conversion",
    description: "Higher conversion rates for e-commerce",
    icon: <TrendingUp className="h-6 w-6 text-highlight" />,
  },
  {
    value: "4.8/5",
    label: "Customer satisfaction",
    description: "Average rating from our customers",
    icon: <Award className="h-6 w-6 text-highlight" />,
  },
  {
    value: "50%",
    label: "Reduced wait times",
    description: "Customers get answers immediately",
    icon: <Headphones className="h-6 w-6 text-highlight" />,
  },
  {
    value: "40%",
    label: "Increased sales",
    description: "Higher sales through personalized recommendations",
    icon: <BarChart className="h-6 w-6 text-highlight" />,
  },
];

const StatsSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-brand-dark to-slate-900 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-highlight rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Proven results for growing businesses
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our AI chatbot platform delivers measurable business impact across
              customer service, sales, and operational efficiency metrics.
            </p>
          </div>

          {/* Main stats with enhanced styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {statsData.map((stat, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 bg-white/10 rounded-full p-3">
                    {stat.icon}
                  </div>
                  <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-highlight to-purple-400 mb-3">
                    {stat.value}
                  </p>
                  <p className="text-lg font-medium text-white mb-2">
                    {stat.label}
                  </p>
                  <p className="text-sm text-gray-300">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional stats with different styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalStats.map((stat, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="bg-white/10 rounded-full p-2 mt-1">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-gray-200 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xs text-gray-400">{stat.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <p className="text-lg text-gray-300 mb-6">
              Join hundreds of businesses already experiencing these results
            </p>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-highlight hover:bg-highlight/90 text-white font-medium transition-all duration-200"
            >
              See our pricing plans
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
