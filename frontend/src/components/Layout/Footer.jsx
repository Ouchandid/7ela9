import React from 'react';
import { 
  Scissors, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Send,
  Heart,
  ExternalLink
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Careers', href: '#careers' },
      { label: 'Press Kit', href: '#press' }
    ],
    services: [
      { label: 'Find Stylists', href: '#find' },
      { label: 'Mobile Service', href: '#mobile' },
      { label: 'Gift Cards', href: '#gifts' },
      { label: 'Membership', href: '#membership' }
    ],
    support: [
      { label: 'Help Center', href: '#help' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact Us', href: '#contact' },
      { label: 'Safety', href: '#safety' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'Accessibility', href: '#accessibility' }
    ]
  };

  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-400' },
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-400' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-sky-400' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-500' }
  ];

  const contactInfo = [
    { icon: Mail, text: 'support@7ela9.com', href: 'mailto:support@7ela9.com' },
    { icon: Phone, text: '+212 (0) 6 00 00 00 00', href: 'tel:+212600000000' },
    { icon: MapPin, text: 'Casablanca, Morocco', href: '#' }
  ];

  return (
    <footer className="relative border-t border-white/5 bg-black overflow-hidden">
      {/* Gradient Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12 md:py-16 border-b border-white/5">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white">
              Stay in <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Style</span>
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get exclusive offers, beauty tips, and early access to new features
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all"
              />
              <button 
                type="submit"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <span>Subscribe</span>
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg blur-md opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 p-2.5 rounded-lg">
                    <Scissors className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="text-2xl font-black">
                  <span className="text-white">7ela9</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">.com</span>
                </span>
              </div>
              
              <p className="text-gray-400 leading-relaxed max-w-sm">
                Redefining beauty experiences. Connecting clients with elite stylists for exceptional transformations.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                {contactInfo.map((item, idx) => (
                  <a 
                    key={idx}
                    href={item.href}
                    className="flex items-center gap-3 text-gray-400 hover:text-pink-400 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-pink-500/10 transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </a>
                ))}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 pt-4">
                {socialLinks.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    aria-label={social.label}
                    className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 ${social.color} hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-110`}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Sections */}
            <div>
              <h5 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Company</h5>
              <ul className="space-y-3">
                {footerLinks.company.map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Services</h5>
              <ul className="space-y-3">
                {footerLinks.services.map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Support</h5>
              <ul className="space-y-3">
                {footerLinks.support.map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Legal</h5>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © {currentYear} 7ela9.com. All rights reserved. Made with{' '}
              <Heart className="w-4 h-4 inline text-pink-500 fill-pink-500 animate-pulse" />{' '}
              in Morocco
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                Sitemap
              </a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                Status
              </a>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="border-t border-white/5 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-30">
            <div className="text-gray-600 text-xs font-bold uppercase tracking-wider">Trusted by 10,000+ clients</div>
            <div className="w-px h-4 bg-white/10"></div>
            <div className="text-gray-600 text-xs font-bold uppercase tracking-wider">500+ Professional Stylists</div>
            <div className="w-px h-4 bg-white/10"></div>
            <div className="text-gray-600 text-xs font-bold uppercase tracking-wider">98% Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;