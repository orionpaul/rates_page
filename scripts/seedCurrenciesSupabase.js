// Script to seed default currencies into Supabase
// Run this with: node scripts/seedCurrenciesSupabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default currencies - rates set to 0.000 for manual entry via admin panel
const currencies = [
  {
    code: 'ZWG',
    name: 'Zimbabwean Gold',
    flag_url: 'https://flagcdn.com/w40/zw.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 1
  },
  {
    code: 'USD',
    name: 'US Dollar',
    flag_url: 'https://flagcdn.com/w40/us.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 2
  },
  {
    code: 'GBP',
    name: 'British Pound',
    flag_url: 'https://flagcdn.com/w40/gb.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 3
  },
  {
    code: 'EUR',
    name: 'Euro',
    flag_url: 'https://flagcdn.com/w40/eu.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 4
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    flag_url: 'https://flagcdn.com/w40/au.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 5
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    flag_url: 'https://flagcdn.com/w40/in.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 6
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    flag_url: 'https://flagcdn.com/w40/cn.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 7
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    flag_url: 'https://flagcdn.com/w40/ca.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 8
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    flag_url: 'https://flagcdn.com/w40/za.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 9
  },
  {
    code: 'BWP',
    name: 'Botswana Pula',
    flag_url: 'https://flagcdn.com/w40/bw.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 10
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    flag_url: 'https://flagcdn.com/w40/ch.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 11
  },
  {
    code: 'MUR',
    name: 'Mauritian Rupee',
    flag_url: 'https://flagcdn.com/w40/mu.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 12
  },
  {
    code: 'NAD',
    name: 'Namibian Dollar',
    flag_url: 'https://flagcdn.com/w40/na.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 13
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    flag_url: 'https://flagcdn.com/w40/dk.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 14
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    flag_url: 'https://flagcdn.com/w40/jp.png',
    buy_rate: 0.000,
    mid_rate: 0.000,
    sell_rate: 0.000,
    order: 15
  }
];

async function seedCurrencies() {
  console.log('🚀 Starting to seed currencies into Supabase...\n');

  try {
    // Check if currencies already exist
    const { data: existing, error: checkError } = await supabase
      .from('currencies')
      .select('code')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing currencies:', checkError.message);
      console.error('\nMake sure you have:');
      console.error('1. Created the Supabase project');
      console.error('2. Run the SQL script to create tables');
      console.error('3. Added Supabase credentials to .env.local');
      process.exit(1);
    }

    if (existing && existing.length > 0) {
      console.log('⚠️  Warning: Currencies table is not empty!');
      console.log('This script will add new currencies alongside existing ones.\n');
    }

    // Insert all currencies
    const { data, error } = await supabase
      .from('currencies')
      .insert(currencies)
      .select();

    if (error) {
      console.error('❌ Error inserting currencies:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully added ${currencies.length} currencies!\n`);
    console.log('📊 Summary:');
    currencies.forEach(c => {
      console.log(`   ${c.code.padEnd(5)} - Buy: ${c.buy_rate.toFixed(3)}, Mid: ${c.mid_rate.toFixed(3)}, Sell: ${c.sell_rate.toFixed(3)}`);
    });

    console.log('\n🎉 All done! Your currencies are now in Supabase.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCurrencies();
