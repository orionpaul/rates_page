// Clear existing currencies and seed fresh data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Currencies in correct order with all rates set to 0.000
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

async function clearAndSeed() {
  console.log('🧹 Clearing existing currencies...\n');

  try {
    // Delete all existing currencies
    const { error: deleteError } = await supabase
      .from('currencies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible id)

    if (deleteError) {
      console.error('❌ Error deleting currencies:', deleteError.message);
      process.exit(1);
    }

    console.log('✅ Cleared existing currencies\n');
    console.log('🚀 Seeding fresh currencies...\n');

    // Insert new currencies
    const { data, error } = await supabase
      .from('currencies')
      .insert(currencies)
      .select();

    if (error) {
      console.error('❌ Error inserting currencies:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully added ${currencies.length} currencies!\n`);
    console.log('📊 Currency List:');
    currencies.forEach((c, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, '0')}. ${c.code.padEnd(5)} - ${c.name}`);
    });

    console.log('\n🎉 All done! Your currencies are ready in Supabase.');
    console.log('\n📝 Next steps:');
    console.log('   1. Login to admin panel: http://localhost:3000/admin/login');
    console.log('   2. Go to "Manage Rates"');
    console.log('   3. Edit each currency to add real rates');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

clearAndSeed();
