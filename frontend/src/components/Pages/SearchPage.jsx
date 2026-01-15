import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapIcon, 
  Scissors, 
  Users, 
  Star, 
  Filter,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  X,
  SlidersHorizontal,
  Grid3x3,
  List
} from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import Button3D from '../UI/Button3D';
import TiltCard from '../UI/TiltCard';

const SearchPage = ({ onNavigate }) => {
  const [allStylists, setAllStylists] = useState([]);
  const [filteredStylists, setFilteredStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({ 
    city: '', 
    category: 'all', 
    sort: 'rating',
    minRating: 0,
    availability: 'all'
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/stylists`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setAllStylists(list);
        setFilteredStylists(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    if (e) e.preventDefault();
    let result = [...allStylists];

    // Filter by city
    if (filters.city) {
      result = result.filter(s => s.city === filters.city);
    }

    // Filter by category
    if (filters.category !== 'all') {
      result = result.filter(s => s.category === filters.category);
    }

    // Filter by minimum rating
    if (filters.minRating > 0) {
      result = result.filter(s => (s.rating || 0) >= filters.minRating);
    }

    // Filter by availability
    if (filters.availability === 'available') {
      result = result.filter(s => (s.waiting || 0) < 5);
    } else if (filters.availability === 'popular') {
      result = result.filter(s => (s.waiting || 0) >= 5);
    }

    // Sort results
    if (filters.sort === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sort === 'waiting') {
      result.sort((a, b) => (a.waiting || 0) - (b.waiting || 0));
    } else if (filters.sort === 'popular') {
      result.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
    }

    setFilteredStylists(result);
  };

  const clearFilters = () => {
    setFilters({ 
      city: '', 
      category: 'all', 
      sort: 'rating',
      minRating: 0,
      availability: 'all'
    });
    setFilteredStylists(allStylists);
  };

  const hasActiveFilters = filters.city || filters.category !== 'all' || filters.minRating > 0 || filters.availability !== 'all';

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-zinc-900/50 to-transparent py-12 md:py-16 mb-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
              <Search className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-pink-300 tracking-wide">DISCOVER TALENT</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Perfect Stylist</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-6">
              Discover top-rated professionals near you. Browse hundreds of verified stylists ready to transform your look.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <div className="font-bold text-white">{allStylists.length}+</div>
                  <div className="text-gray-500">Stylists</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="font-bold text-white">4.8+</div>
                  <div className="text-gray-500">Avg Rating</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-white">98%</div>
                  <div className="text-gray-500">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button3D 
              variant="secondary" 
              onClick={() => onNavigate('map')}
              className="flex items-center gap-2"
            >
              <MapIcon className="w-4 h-4" /> 
              <span className="hidden sm:inline">Map View</span>
            </Button3D>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400">
              <span className="font-semibold text-white">{filteredStylists.length}</span> results
            </div>
            
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
            <GlassCard className="p-6 bg-zinc-900/80 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-bold text-white">Refine Your Search</h3>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>

              <form onSubmit={applyFilters} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Location */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Location</label>
                    <div className="relative">
                      <select 
                        name="city" 
                        value={filters.city}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 pl-11 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-pink-500/50 focus:bg-black/70 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">All Cities</option>
                        <option value="Paris">Paris</option>
                        <option value="Lyon">Lyon</option>
                        <option value="Marseille">Marseille</option>
                        <option value="Casablanca">Casablanca</option>
                        <option value="Rabat">Rabat</option>
                      </select>
                      <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Category</label>
                    <div className="relative">
                      <select 
                        name="category" 
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 pl-11 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-pink-500/50 focus:bg-black/70 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        <option value="Femme">Women's Styling</option>
                        <option value="Homme">Men's Styling</option>
                        <option value="Déplacé">Mobile Service</option>
                        <option value="Enfant">Kids</option>
                      </select>
                      <Scissors className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Availability */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Availability</label>
                    <div className="relative">
                      <select 
                        name="availability" 
                        value={filters.availability}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 pl-11 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-pink-500/50 focus:bg-black/70 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">All Stylists</option>
                        <option value="available">Available Now</option>
                        <option value="popular">Most Popular</option>
                      </select>
                      <Clock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Sort */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Sort By</label>
                    <div className="relative">
                      <select 
                        name="sort" 
                        value={filters.sort}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 pl-11 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-pink-500/50 focus:bg-black/70 transition-all appearance-none cursor-pointer"
                      >
                        <option value="rating">Highest Rating</option>
                        <option value="waiting">Shortest Wait</option>
                        <option value="popular">Most Popular</option>
                      </select>
                      <TrendingUp className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-300">Minimum Rating</label>
                  <div className="flex items-center gap-4">
                    {[0, 3, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                          filters.minRating === rating
                            ? 'bg-pink-500 border-pink-500 text-white'
                            : 'bg-black/30 border-white/10 text-gray-400 hover:border-pink-500/30'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-semibold">{rating === 0 ? 'All' : `${rating}+`}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button3D type="submit" className="flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 mr-2" /> Apply Filters
                  </Button3D>
                  {hasActiveFilters && (
                    <Button3D type="button" variant="outline" onClick={clearFilters}>
                      Reset
                    </Button3D>
                  )}
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        {/* Results Grid/List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
              <Scissors className="w-6 h-6 text-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
          </div>
        ) : filteredStylists.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredStylists.map(stylist => (
              viewMode === 'grid' ? (
                // Grid View
                <TiltCard key={stylist.id} onClick={() => onNavigate('profile', stylist.id)}>
                  <div className="h-full group bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 rounded-2xl p-6 cursor-pointer hover:from-zinc-800/80 hover:to-zinc-800/40 transition-all duration-500 border border-white/5 hover:border-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/20">
                    <div className="flex flex-col items-center">
                      {/* Profile Image */}
                      <div className="relative w-24 h-24 mb-5">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity"></div>
                        <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-pink-500/30 transition-all">
                          <img 
                            src={stylist.image || `https://placehold.co/120x120/111/FF69B4?text=${stylist.name?.[0] || 'S'}`} 
                            alt={stylist.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <h2 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 transition-all text-center mb-2">
                        {stylist.name || 'Stylist'}
                      </h2>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-4">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{stylist.city || 'City'}</span>
                        <span>•</span>
                        <span className="text-pink-400">{stylist.category || 'Category'}</span>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-4">
                        {[1,2,3,4,5].map(i => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i <= Math.round(stylist.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} 
                          />
                        ))}
                        <span className="text-white ml-2 text-sm font-bold">({stylist.rating || 0})</span>
                      </div>

                      {/* Stats */}
                      <div className="w-full grid grid-cols-2 gap-2 mb-4">
                        <div className="flex flex-col items-center p-2 bg-black/30 rounded-lg">
                          <div className="flex items-center gap-1 text-yellow-400 mb-1">
                            <Users className="w-3 h-3" />
                          </div>
                          <span className="text-xs text-gray-500">Wait: <span className="text-white font-bold">{stylist.waiting || 0}</span></span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-black/30 rounded-lg">
                          <div className="flex items-center gap-1 text-blue-400 mb-1">
                            <Scissors className="w-3 h-3" />
                          </div>
                          <span className="text-xs text-gray-500">Active: <span className="text-white font-bold">{stylist.capacity || 0}</span></span>
                        </div>
                      </div>

                      <Button3D className="w-full !py-2.5 !text-sm">
                        View Profile
                      </Button3D>
                    </div>
                  </div>
                </TiltCard>
              ) : (
                // List View
                <div 
                  key={stylist.id}
                  onClick={() => onNavigate('profile', stylist.id)}
                  className="group bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 rounded-2xl p-6 cursor-pointer hover:from-zinc-800/80 hover:to-zinc-800/40 transition-all duration-300 border border-white/5 hover:border-pink-500/30 hover:shadow-xl hover:shadow-pink-500/10"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-md opacity-30 group-hover:opacity-60 transition-opacity"></div>
                      <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-pink-500/30 transition-all">
                        <img 
                          src={stylist.image || `https://placehold.co/120x120/111/FF69B4?text=${stylist.name?.[0] || 'S'}`} 
                          alt={stylist.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-zinc-900"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors mb-2">
                        {stylist.name || 'Stylist'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{stylist.city || 'City'}</span>
                        </div>
                        <span>•</span>
                        <span className="text-pink-400">{stylist.category || 'Category'}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i <= Math.round(stylist.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} 
                            />
                          ))}
                          <span className="text-white ml-2 font-bold">{stylist.rating || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Wait: {stylist.waiting || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-400">
                          <Scissors className="w-4 h-4" />
                          <span className="text-sm">Active: {stylist.capacity || 0}</span>
                        </div>
                      </div>
                    </div>

                    <Button3D className="flex-shrink-0">
                      View Profile
                    </Button3D>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-20">
            <div className="bg-zinc-900/50 rounded-3xl p-12 max-w-md mx-auto border border-white/5">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800/50 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No stylists found</h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your filters or browse all available stylists.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button3D onClick={clearFilters}>
                  Clear All Filters
                </Button3D>
                <Button3D variant="secondary" onClick={() => onNavigate('map')}>
                  <MapIcon className="w-4 h-4 mr-2" />
                  View Map
                </Button3D>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Spacing */}
      <div className="h-20"></div>
    </div>
  );
};

export default SearchPage;