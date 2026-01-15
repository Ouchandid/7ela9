import React, { useState } from 'react';
import { 
  Scissors, 
  TrendingUp, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Map, 
  Car,
  Home,
  User,
  Grid,
  Heart
} from 'lucide-react';
import Button3D from './Button3D';

const Navbar = ({ user, onNavigate, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  // Navigation items configuration
  const navItems = user?.type === 'coiffeur' 
    ? [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, highlight: true },
      ]
    : [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'search', label: 'Search', icon: Search },
        { id: 'map', label: 'Map', icon: Map },
        ...(user ? [{ id: 'request-mobile', label: 'Mobile', icon: Car }] : []),
      ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Section - Left */}
            <div className="flex-shrink-0 w-[200px]">
              <div 
                onClick={() => handleNavigation('home')} 
                className="flex items-center gap-3 cursor-pointer group w-fit"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
                    <Scissors className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                </div>
                <span className="text-2xl font-black tracking-tight whitespace-nowrap">
                  <span className="text-white">7ela9</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">.com</span>
                </span>
              </div>
            </div>

            {/* Center Navigation - Desktop */}
            <div className="hidden lg:flex flex-1 justify-center">
              <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 shadow-xl">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-300 ${
                      item.highlight 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                    {item.highlight && (
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Center Navigation - Tablet */}
            <div className="hidden md:flex lg:hidden flex-1 justify-center">
              <div className="flex items-center gap-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`relative p-3 rounded-xl transition-all duration-300 ${
                      item.highlight 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Section - User Actions */}
            <div className="flex items-center justify-end gap-3 w-[200px]">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>

              {/* Desktop User Section */}
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <>
                    <button 
                      onClick={onLogout}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-red-500/10 transition-all duration-300 group border border-transparent hover:border-red-500/20"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                      <span className="text-sm font-semibold text-gray-300 group-hover:text-red-400 hidden xl:block">Logout</span>
                    </button>
                    <div 
                      onClick={() => user.type === 'coiffeur' ? handleNavigation('dashboard') : null}
                      className="flex items-center gap-3 cursor-pointer group p-2 pr-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
                    >
                      <div className="hidden lg:flex flex-col items-end">
                        <span className="text-sm font-bold text-white">{user.name}</span>
                        <span className="text-xs text-gray-400 capitalize font-medium">{user.type}</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-md opacity-50"></div>
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white overflow-hidden ring-2 ring-white/10">
                          {user.image ? (
                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleNavigation('login')} 
                      className="hidden lg:flex items-center text-sm font-semibold text-gray-300 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
                    >
                      Login
                    </button>
                    <Button3D 
                      variant="primary" 
                      className="!px-6 !py-2.5 !text-sm font-semibold whitespace-nowrap"
                      onClick={() => handleNavigation('signup')}
                    >
                      Sign Up
                    </Button3D>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md md:hidden"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu */}
        <div 
          className={`md:hidden fixed top-20 left-0 right-0 z-50 bg-black/98 backdrop-blur-2xl border-b border-white/10 shadow-2xl transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-y-0' : '-translate-y-[calc(100%+5rem)]'
          }`}
        >
          <div className="px-4 py-8 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Mobile Navigation */}
            <div className="space-y-2 mb-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                    item.highlight
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-400 border border-pink-500/30 shadow-lg shadow-pink-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold text-base">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Additional mobile links */}
            <div className="space-y-2 mb-8 pb-8 border-b border-white/10">
              <button 
                onClick={() => handleNavigation('categories')}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
              >
                <Grid className="w-5 h-5" />
                <span className="font-semibold">Categories</span>
              </button>
              <button 
                onClick={() => handleNavigation('favorites')}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
              >
                <Heart className="w-5 h-5" />
                <span className="font-semibold">Favorites</span>
              </button>
            </div>

            {/* User section for mobile */}
            {user ? (
              <div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-md opacity-50"></div>
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white ring-2 ring-white/10">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User className="w-7 h-7" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{user.name}</p>
                      <p className="text-sm text-gray-400 capitalize font-medium">{user.type}</p>
                    </div>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-3 rounded-xl hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/20"
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => handleNavigation('login')} 
                  className="w-full text-center py-4 rounded-2xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all duration-300"
                >
                  Login
                </button>
                <Button3D 
                  variant="primary" 
                  className="w-full !py-4 font-semibold"
                  onClick={() => handleNavigation('signup')}
                >
                  Sign Up
                </Button3D>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20"></div>
    </>
  );
};

export default Navbar;