'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Currency, Media } from '@/types';
import Image from 'next/image';
import YouTube from 'react-youtube';

export default function Home() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [media, setMedia] = useState<Media | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Fetch currencies and subscribe to updates
    const fetchCurrencies = async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('order', { ascending: true });

      if (data && !error) {
        setCurrencies(data.map(row => ({
          id: row.id,
          code: row.code,
          name: row.name,
          flagUrl: row.flag_url,
          buyRate: parseFloat(row.buy_rate),
          midRate: parseFloat(row.mid_rate),
          sellRate: parseFloat(row.sell_rate),
          order: row.order,
          updatedAt: new Date(row.updated_at),
        })));
      }
    };

    // Fetch active media and subscribe to updates
    const fetchMedia = async () => {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (data && !error) {
        setMedia({
          id: data.id,
          type: data.type,
          url: data.url,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedBy: data.updated_by,
        });
      } else if (error && error.code === 'PGRST116') {
        // No active media found
        setMedia(null);
      }
    };

    fetchCurrencies();
    fetchMedia();

    // Subscribe to real-time updates for currencies with instant refresh
    const currenciesSubscription = supabase
      .channel('public:currencies')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'currencies'
      }, (payload) => {
        console.log('Currency change detected:', payload);
        fetchCurrencies(); // Instant refresh on any change
      })
      .subscribe((status) => {
        console.log('Currencies subscription status:', status);
      });

    // Subscribe to real-time updates for media with instant refresh
    const mediaSubscription = supabase
      .channel('public:media')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'media'
      }, (payload) => {
        console.log('Media change detected:', payload);
        fetchMedia(); // Instant refresh on any change
      })
      .subscribe((status) => {
        console.log('Media subscription status:', status);
      });

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      supabase.removeChannel(currenciesSubscription);
      supabase.removeChannel(mediaSubscription);
      clearInterval(timer);
    };
  }, []);

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || '';
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-white flex">
      {/* Left Side - Media Display */}
      <div className="w-1/2 h-full relative overflow-hidden">
        {/* Artistic Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-black">
          {/* Animated geometric patterns */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-secondary blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-light blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(0, 168, 232, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 168, 232, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}></div>

          {/* Diagonal light streaks */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-30 animate-streak-1"></div>
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-30 animate-streak-2"></div>
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary-light to-transparent opacity-30 animate-streak-3"></div>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative z-10 w-full h-full">
          {media?.type === 'youtube' ? (
            <div className="w-full h-full">
              <YouTube
                videoId={getYouTubeVideoId(media.url)}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 1,
                    mute: 0, // Sound enabled
                    loop: 1,
                    playlist: getYouTubeVideoId(media.url), // Required for looping
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    enablejsapi: 1,
                  },
                }}
                onEnd={(event) => {
                  event.target.playVideo(); // Restart video when it ends
                }}
                className="w-full h-full"
              />
            </div>
          ) : media?.type === 'image' ? (
            <Image
              src={media.url}
              alt="Advertisement"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="relative">
                {/* Glowing effect behind logo */}
                <div className="absolute inset-0 bg-secondary/30 blur-3xl animate-pulse"></div>
                <Image
                  src="/logo.png"
                  alt="Talk&Pay Logo"
                  width={400}
                  height={400}
                  className="object-contain relative z-10"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Exchange Rates */}
      <div className="w-1/2 h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 flex flex-col relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 blur-3xl -z-0"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-3xl -z-0"></div>

        {/* Header */}
        <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-lg p-4 mb-4 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <Image
                src="/logo.png"
                alt="Talk&Pay"
                width={120}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                Foreign Exchange Rates
              </h1>
              <div className="flex items-center justify-end gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono font-semibold text-primary">
                    {currentTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="relative z-10 grid grid-cols-4 gap-4 mb-2 px-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Currency</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Buy Rate</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Mid Rate</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Sell Rate</div>
        </div>

        {/* Rates Cards */}
        <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-2 custom-scrollbar">
          {currencies.map((currency, index) => (
            <div
              key={currency.id}
              className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-secondary/30 transform hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="grid grid-cols-4 gap-4 p-3 items-center">
                {/* Currency Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {currency.flagUrl && (
                      <div className="w-16 h-12 overflow-hidden shadow-lg ring-1 ring-gray-200 bg-white">
                        <Image
                          src={currency.flagUrl}
                          alt={currency.code}
                          width={64}
                          height={48}
                          className="object-cover w-full h-full"
                          priority
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {currency.code}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {currency.name}
                    </div>
                  </div>
                </div>

                {/* Buy Rate */}
                <div className="text-center">
                  <div className="inline-block px-5 py-2 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600 shadow-sm">
                    <div className="font-mono text-xl font-bold text-green-800">
                      {currency.buyRate.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Mid Rate */}
                <div className="text-center">
                  <div className="inline-block px-5 py-2 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600 shadow-sm">
                    <div className="font-mono text-xl font-bold text-blue-800">
                      {currency.midRate.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Sell Rate */}
                <div className="text-center">
                  <div className="inline-block px-5 py-2 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-600 shadow-sm">
                    <div className="font-mono text-xl font-bold text-orange-800">
                      {currency.sellRate.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* News Ticker / Announcement Banner */}
        <div className="relative z-10 mt-4 bg-gradient-to-r from-primary via-primary-dark to-primary overflow-hidden shadow-lg border-2 border-primary-light">
          {/* Animated stripes background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
          </div>

          <div className="relative py-3 px-4">
            {/* Headline Badge */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-secondary px-4 py-2 shadow-lg">
              <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
              <span className="text-white font-bold text-sm uppercase tracking-wider">Live</span>
            </div>

            {/* Scrolling Text Container */}
            <div className="overflow-hidden ml-24">
              <div className="flex animate-scroll-left whitespace-nowrap">
                {/* Duplicate text for seamless loop */}
                <div className="flex items-center gap-8 pr-8">
                  <span className="text-white text-lg font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Rates are indicative and subject to change without prior notice</span>
                  </span>
                  <span className="text-secondary-light text-lg">•</span>
                  <span className="text-white text-lg font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Updated in real-time for your convenience</span>
                  </span>
                  <span className="text-secondary-light text-lg">•</span>
                  <span className="text-white text-lg font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>Contact us for large transactions and special rates</span>
                  </span>
                  <span className="text-secondary-light text-lg">•</span>
                </div>
                {/* Duplicate for seamless loop */}
                <div className="flex items-center gap-8 pr-8">
                  <span className="text-white text-lg font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Rates are indicative and subject to change without prior notice</span>
                  </span>
                  <span className="text-secondary-light text-lg">•</span>
                  <span className="text-white text-lg font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Updated in real-time for your convenience</span>
                  </span>
                  <span className="text-secondary-light text-lg">•</span>
                  <span className="text-white text-lg font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>Contact us for large transactions and special rates</span>
                  </span>
                  <span className="text-secondary-light text-lg">•</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
