'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Currency, Media } from '@/types';
import Image from 'next/image';
import YouTube from 'react-youtube';

interface TickerMessage {
  id: string;
  message: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

export default function Home() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [media, setMedia] = useState<Media | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set mounted flag to prevent hydration issues
    setIsMounted(true);

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
      } else if (error) {
        console.error('Error fetching currencies:', error);
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

    // Fetch ticker messages
    const fetchTickerMessages = async () => {
      const { data, error } = await supabase
        .from('ticker_messages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (data && !error) {
        setTickerMessages(data);
      }
    };

    fetchCurrencies();
    fetchMedia();
    fetchTickerMessages();

    // Subscribe to real-time updates for currencies with instant refresh
    const currenciesSubscription = supabase
      .channel('public:currencies')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'currencies'
      }, (payload) => {
        console.log('🔥 Currency updated:', payload.eventType);
        fetchCurrencies(); // Instant refresh on any change
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to currency updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error - check database settings');
        }
        if (err) console.error('Subscription error:', err);
      });

    // Subscribe to real-time updates for media with instant refresh
    const mediaSubscription = supabase
      .channel('public:media')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'media'
      }, (payload) => {
        console.log('🔥 Media updated:', payload.eventType);
        fetchMedia(); // Instant refresh on any change
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('✅ Subscribed to media updates');
      });

    // Subscribe to real-time updates for ticker messages with instant refresh
    const tickerSubscription = supabase
      .channel('public:ticker_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ticker_messages'
      }, (payload) => {
        console.log('🔥 Ticker updated:', payload.eventType);
        fetchTickerMessages(); // Instant refresh on any change
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('✅ Subscribed to ticker updates');
      });

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      supabase.removeChannel(currenciesSubscription);
      supabase.removeChannel(mediaSubscription);
      supabase.removeChannel(tickerSubscription);
      clearInterval(timer);
    };
  }, []);

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match?.[1] || '';
  };

  const getIconSvg = (icon: string) => {
    switch (icon) {
      case 'clock':
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'mail':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        );
      default: // 'info'
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-white flex flex-col md:flex-row">
      {/* Left Side - Media Display - Hidden on mobile */}
      <div className="hidden md:block md:w-1/2 h-full relative overflow-hidden">
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
                    autoplay: 1, // Autoplay enabled
                    mute: 0, // Sound enabled (note: browsers may block autoplay with sound)
                    loop: 1,
                    playlist: getYouTubeVideoId(media.url), // Required for looping
                    controls: 1, // Show controls so users can adjust volume
                    modestbranding: 1,
                    rel: 0,
                    enablejsapi: 1,
                    playsinline: 1, // Required for mobile autoplay
                  },
                }}
                onEnd={(event) => {
                  event.target.playVideo(); // Restart video when it ends
                }}
                onReady={(event) => {
                  // Force autoplay on ready
                  event.target.playVideo();
                  // Unmute after 1 second (gives browser time to allow autoplay)
                  setTimeout(() => {
                    event.target.unMute();
                  }, 1000);
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
                {/* Electrified white glow layers - intense and bright */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/40 blur-3xl animate-electric-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 blur-3xl animate-electric-pulse-delayed"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/60 blur-2xl animate-electric-pulse-fast"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-100/40 blur-xl animate-pulse-slow"></div>

                {/* Matrix-style green glow layers (subtle) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/15 blur-3xl animate-matrix-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/20 blur-2xl animate-matrix-pulse-delayed"></div>

                {/* Matrix scanlines */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.3) 2px, rgba(34, 197, 94, 0.3) 4px)',
                  animation: 'scanlines 8s linear infinite'
                }}></div>

                {/* Animated rotating rings around logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="absolute w-96 h-96 border-2 border-secondary/40 animate-spin-slow"></div>
                  <div className="absolute w-80 h-80 border-2 border-accent/30 animate-spin-reverse" style={{ top: '8%', left: '8%' }}></div>
                  <div className="absolute w-64 h-64 border border-primary-light/30 animate-spin-slower" style={{ top: '16%', left: '16%' }}></div>
                </div>

                {/* Pulsing orbs around logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96">
                  <div className="absolute top-0 left-1/2 w-4 h-4 bg-secondary blur-lg animate-orbit-1"></div>
                  <div className="absolute top-1/2 right-0 w-3 h-3 bg-accent blur-lg animate-orbit-2"></div>
                  <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-primary-light blur-lg animate-orbit-3"></div>
                  <div className="absolute top-1/2 left-0 w-3 h-3 bg-secondary blur-lg animate-orbit-4"></div>
                </div>

                {/* Financial symbols orbiting logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
                  {/* Dollar signs */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 text-8xl font-bold text-green-400/60 animate-orbit-currency-1 drop-shadow-lg">$</div>
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-7xl font-bold text-green-400/50 animate-orbit-currency-2 drop-shadow-lg">$</div>

                  {/* Euro signs */}
                  <div className="absolute top-1/2 right-10 -translate-y-1/2 text-7xl font-bold text-blue-400/60 animate-orbit-currency-3 drop-shadow-lg">€</div>
                  <div className="absolute top-1/2 left-10 -translate-y-1/2 text-7xl font-bold text-blue-400/50 animate-orbit-currency-4 drop-shadow-lg">€</div>

                  {/* Pound signs */}
                  <div className="absolute top-20 right-20 text-6xl font-bold text-cyan-400/60 animate-orbit-currency-5 drop-shadow-lg">£</div>
                  <div className="absolute bottom-20 left-20 text-6xl font-bold text-cyan-400/50 animate-orbit-currency-6 drop-shadow-lg">£</div>

                  {/* Yen signs */}
                  <div className="absolute top-20 left-20 text-6xl font-bold text-yellow-400/60 animate-orbit-currency-7 drop-shadow-lg">¥</div>
                  <div className="absolute bottom-20 right-20 text-6xl font-bold text-yellow-400/50 animate-orbit-currency-8 drop-shadow-lg">¥</div>

                  {/* Bitcoin symbol */}
                  <div className="absolute top-1/3 right-16 text-7xl font-bold text-orange-400/60 animate-orbit-currency-9 drop-shadow-lg">₿</div>

                  {/* Generic coin symbols */}
                  <div className="absolute bottom-1/3 left-16 text-6xl text-amber-400/70 animate-orbit-currency-10 drop-shadow-lg">🪙</div>
                  <div className="absolute top-1/4 left-1/4 text-6xl text-yellow-400/60 animate-orbit-currency-11 drop-shadow-lg">💰</div>
                  <div className="absolute bottom-1/4 right-1/4 text-6xl text-green-400/60 animate-orbit-currency-12 drop-shadow-lg">💵</div>
                </div>

                {/* Central glowing pulse - brighter with Matrix green */}
                <div className="absolute inset-0 bg-green-400/30 blur-3xl animate-matrix-pulse"></div>
                <div className="absolute inset-0 bg-white/20 blur-3xl animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-400/30 to-green-500/20 blur-2xl animate-pulse-slower"></div>

                {/* Logo with floating animation - intense electrified white glow */}
                <div className="relative z-10 animate-float">
                  {/* Electrified white glow around logo - intense */}
                  <div className="absolute inset-0 bg-white/70 blur-3xl animate-electric-pulse"></div>
                  <div className="absolute inset-0 bg-blue-200/50 blur-2xl animate-electric-pulse-delayed"></div>
                  <div className="absolute inset-0 bg-white/80 blur-xl animate-electric-pulse-fast"></div>

                  {/* Matrix-style green glow (subtle accent) */}
                  <div className="absolute inset-0 bg-green-500/20 blur-2xl animate-matrix-pulse"></div>
                  <div className="absolute inset-0 bg-emerald-300/15 blur-xl animate-matrix-pulse-delayed"></div>

                  {/* Logo with intense white electric shadow */}
                  <div className="relative">
                    <Image
                      src="/logo.png"
                      alt="Talk&Pay Logo"
                      width={400}
                      height={400}
                      className="object-contain relative z-10 brightness-125"
                      style={{
                        filter:
                          'drop-shadow(0 0 10px rgba(255, 255, 255, 0.9)) ' +
                          'drop-shadow(0 0 20px rgba(255, 255, 255, 0.7)) ' +
                          'drop-shadow(0 0 30px rgba(0, 200, 255, 0.6)) ' +
                          'drop-shadow(0 0 40px rgba(34, 197, 94, 0.4)) ' +
                          'drop-shadow(0 0 60px rgba(255, 255, 255, 0.3))'
                      }}
                    />
                  </div>
                </div>

                {/* Radiating waves - more visible */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-72 h-72 border-2 border-secondary/50 animate-ping-slow"></div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-96 h-96 border-2 border-accent/40 animate-ping-slower"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Exchange Rates */}
      <div className="w-full md:w-1/2 h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-3 md:p-6 flex flex-col relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 blur-3xl -z-0"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-3xl -z-0"></div>

        {/* Financial Data Stream Lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-10 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-data-flow"></div>
          <div className="absolute top-32 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary to-transparent animate-data-flow-delayed-1"></div>
          <div className="absolute top-56 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent animate-data-flow-delayed-2"></div>
          <div className="absolute bottom-40 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-data-flow-delayed-3"></div>
          <div className="absolute bottom-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary to-transparent animate-data-flow"></div>
        </div>

        {/* Floating Currency Symbols */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 text-6xl font-bold text-primary animate-float-currency-1">$</div>
          <div className="absolute top-40 right-20 text-5xl font-bold text-secondary animate-float-currency-2">€</div>
          <div className="absolute bottom-60 left-20 text-5xl font-bold text-accent animate-float-currency-3">£</div>
          <div className="absolute bottom-40 right-10 text-4xl font-bold text-primary-light animate-float-currency-4">¥</div>
          <div className="absolute top-1/2 left-1/4 text-5xl font-bold text-secondary animate-float-currency-5">₹</div>
          <div className="absolute top-1/3 right-1/3 text-4xl font-bold text-accent animate-float-currency-6">¥</div>
        </div>

        {/* Digital Number Rain */}
        <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 text-xs text-primary font-mono animate-number-rain-1">
            <div>1.234</div>
            <div>5.678</div>
            <div>9.012</div>
          </div>
          <div className="absolute top-0 left-1/2 text-xs text-secondary font-mono animate-number-rain-2">
            <div>0.987</div>
            <div>6.543</div>
            <div>2.109</div>
          </div>
          <div className="absolute top-0 left-3/4 text-xs text-accent font-mono animate-number-rain-3">
            <div>8.765</div>
            <div>4.321</div>
            <div>0.543</div>
          </div>
        </div>

        {/* Market Chart Line Animation */}
        <svg className="absolute bottom-0 left-0 w-full h-32 opacity-10 pointer-events-none" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <path
            d="M0,100 Q250,50 500,80 T1000,60"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="3"
            className="animate-draw-line"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#003A70" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#00A8E8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00C8FF" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Pulsing Data Dots */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-500 animate-pulse-data"></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-500 animate-pulse-data-delayed"></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-orange-500 animate-pulse-data"></div>
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-green-500 animate-pulse-data-delayed"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-lg p-2 md:p-4 mb-2 md:mb-4 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
            <div className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Talk&Pay"
                width={100}
                height={40}
                className="object-contain md:w-[120px] md:h-[48px]"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
            <div className="text-center md:text-right">
              <h1 className="text-lg md:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                Foreign Exchange Rates
              </h1>
              <div className="flex items-center justify-center md:justify-end gap-2 md:gap-3 lg:gap-4 text-xs lg:text-base text-gray-600">
                {isMounted && (
                  <>
                    <div className="flex items-center gap-1 lg:gap-2">
                      <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="flex items-center gap-1 lg:gap-2">
                      <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="relative z-10 grid grid-cols-4 gap-2 md:gap-4 lg:gap-6 mb-1 md:mb-2 px-2 md:px-4 lg:px-6">
          <div className="text-[10px] md:text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider">Currency</div>
          <div className="text-[10px] md:text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider text-center">Buy</div>
          <div className="text-[10px] md:text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider text-center">Mid</div>
          <div className="text-[10px] md:text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider text-center">Sell</div>
        </div>

        {/* Rates Cards - Auto-scrolling */}
        <div className="relative z-10 flex-1 overflow-hidden">
          <div className={`animate-scroll-up ${currencies.length > 10 ? 'animate-scroll-up-slow' : currencies.length < 6 ? 'animate-scroll-up-fast' : ''}`}>
            {/* First set of currencies */}
            <div className="space-y-1 md:space-y-2 lg:space-y-3 pr-1 md:pr-2 lg:pr-3">
              {currencies.map((currency, index) => (
                <div
                  key={`first-${currency.id}`}
                  className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-secondary/30 transform hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="grid grid-cols-4 gap-2 md:gap-4 lg:gap-6 p-2 md:p-3 lg:p-4 items-center">
                    {/* Currency Info */}
                    <div className="flex items-center gap-1 md:gap-3 lg:gap-4">
                      <div className="relative flex-shrink-0">
                        {currency.flagUrl && (
                          <div className="w-10 h-8 md:w-16 md:h-12 lg:w-20 lg:h-16 overflow-hidden shadow-lg ring-1 ring-gray-200 bg-white">
                            <Image
                              src={currency.flagUrl}
                              alt={currency.code}
                              width={80}
                              height={64}
                              className="object-cover w-full h-full"
                              priority
                            />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm md:text-lg lg:text-2xl text-gray-900">
                          {currency.code}
                        </div>
                        <div className="text-[10px] md:text-xs lg:text-base text-gray-600 font-medium truncate">
                          {currency.name}
                        </div>
                      </div>
                    </div>

                    {/* Buy Rate */}
                    <div className="text-center">
                      <div className="inline-block px-2 py-1 md:px-5 md:py-2 lg:px-6 lg:py-3 bg-gradient-to-br from-green-50 to-green-100 border-l-2 md:border-l-4 lg:border-l-[6px] border-green-600 shadow-sm">
                        <div className="font-mono text-xs md:text-xl lg:text-3xl font-bold text-green-800">
                          {currency.buyRate.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    {/* Mid Rate */}
                    <div className="text-center">
                      <div className="inline-block px-2 py-1 md:px-5 md:py-2 lg:px-6 lg:py-3 bg-gradient-to-br from-blue-50 to-blue-100 border-l-2 md:border-l-4 lg:border-l-[6px] border-blue-600 shadow-sm">
                        <div className="font-mono text-xs md:text-xl lg:text-3xl font-bold text-blue-800">
                          {currency.midRate.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    {/* Sell Rate */}
                    <div className="text-center">
                      <div className="inline-block px-2 py-1 md:px-5 md:py-2 lg:px-6 lg:py-3 bg-gradient-to-br from-orange-50 to-orange-100 border-l-2 md:border-l-4 lg:border-l-[6px] border-orange-600 shadow-sm">
                        <div className="font-mono text-xs md:text-xl lg:text-3xl font-bold text-orange-800">
                          {currency.sellRate.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Duplicate set for seamless loop */}
            <div className="space-y-1 md:space-y-2 lg:space-y-3 pr-1 md:pr-2 lg:pr-3 mt-1 md:mt-2 lg:mt-3">
              {currencies.map((currency) => (
                <div
                  key={`second-${currency.id}`}
                  className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-secondary/30 transform hover:scale-[1.02]"
                >
                  <div className="grid grid-cols-4 gap-2 md:gap-4 lg:gap-6 p-2 md:p-3 lg:p-4 items-center">
                    {/* Currency Info */}
                    <div className="flex items-center gap-1 md:gap-3 lg:gap-4">
                      <div className="relative flex-shrink-0">
                        {currency.flagUrl && (
                          <div className="w-10 h-8 md:w-16 md:h-12 lg:w-20 lg:h-16 overflow-hidden shadow-lg ring-1 ring-gray-200 bg-white">
                            <Image
                              src={currency.flagUrl}
                              alt={currency.code}
                              width={80}
                              height={64}
                              className="object-cover w-full h-full"
                              priority
                            />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm md:text-lg lg:text-2xl text-gray-900">
                          {currency.code}
                        </div>
                        <div className="text-[10px] md:text-xs lg:text-base text-gray-600 font-medium truncate">
                          {currency.name}
                        </div>
                      </div>
                    </div>

                    {/* Buy Rate */}
                    <div className="text-center">
                      <div className="inline-block px-2 py-1 md:px-5 md:py-2 lg:px-6 lg:py-3 bg-gradient-to-br from-green-50 to-green-100 border-l-2 md:border-l-4 lg:border-l-[6px] border-green-600 shadow-sm">
                        <div className="font-mono text-xs md:text-xl lg:text-3xl font-bold text-green-800">
                          {currency.buyRate.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    {/* Mid Rate */}
                    <div className="text-center">
                      <div className="inline-block px-2 py-1 md:px-5 md:py-2 lg:px-6 lg:py-3 bg-gradient-to-br from-blue-50 to-blue-100 border-l-2 md:border-l-4 lg:border-l-[6px] border-blue-600 shadow-sm">
                        <div className="font-mono text-xs md:text-xl lg:text-3xl font-bold text-blue-800">
                          {currency.midRate.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    {/* Sell Rate */}
                    <div className="text-center">
                      <div className="inline-block px-2 py-1 md:px-5 md:py-2 lg:px-6 lg:py-3 bg-gradient-to-br from-orange-50 to-orange-100 border-l-2 md:border-l-4 lg:border-l-[6px] border-orange-600 shadow-sm">
                        <div className="font-mono text-xs md:text-xl lg:text-3xl font-bold text-orange-800">
                          {currency.sellRate.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* News Ticker / Announcement Banner */}
        <div className="relative z-10 mt-2 md:mt-4 bg-gradient-to-r from-primary via-primary-dark to-primary overflow-hidden shadow-lg border md:border-2 border-primary-light">
          {/* Animated stripes background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
          </div>

          <div className="relative py-2 md:py-3 px-2 md:px-4">
            {/* Headline Badge */}
            <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 md:gap-2 bg-secondary px-2 md:px-4 py-1 md:py-2 shadow-lg">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 animate-pulse"></div>
              <span className="text-white font-bold text-[10px] md:text-sm uppercase tracking-wider">Live</span>
            </div>

            {/* Scrolling Text Container */}
            <div className="overflow-hidden ml-14 md:ml-24">
              <div className="flex animate-scroll-left whitespace-nowrap">
                {/* Duplicate text for seamless loop */}
                <div className="flex items-center gap-4 md:gap-8 lg:gap-10 pr-4 md:pr-8 lg:pr-10">
                  {tickerMessages.map((message) => (
                    <span key={`msg1-${message.id}`} className="text-white text-sm md:text-lg lg:text-2xl font-semibold flex items-center gap-2 md:gap-3 lg:gap-4">
                      {getIconSvg(message.icon)}
                      <span>{message.message}</span>
                    </span>
                  ))}
                  {tickerMessages.map((_, index) => (
                    <span key={`sep1-${index}`} className="text-secondary-light text-sm md:text-lg lg:text-2xl">•</span>
                  ))}
                </div>
                {/* Duplicate for seamless loop */}
                <div className="flex items-center gap-4 md:gap-8 lg:gap-10 pr-4 md:pr-8 lg:pr-10">
                  {tickerMessages.map((message) => (
                    <span key={`msg2-${message.id}`} className="text-white text-sm md:text-lg lg:text-2xl font-semibold flex items-center gap-2 md:gap-3 lg:gap-4">
                      {getIconSvg(message.icon)}
                      <span>{message.message}</span>
                    </span>
                  ))}
                  {tickerMessages.map((_, index) => (
                    <span key={`sep2-${index}`} className="text-secondary-light text-sm md:text-lg lg:text-2xl">•</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
