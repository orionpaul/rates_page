// Update user role to admin in Supabase users table
//
// IMPORTANT: Users are authenticated via Firebase Auth, but their metadata
// (role, etc.) is stored in Supabase's users table. This script updates
// the role in Supabase to grant admin access.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateUserRole() {
  // Get the email from command line arguments
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Please provide an email address');
    console.log('Usage: node scripts/updateUserRole.js <email>');
    console.log('Example: node scripts/updateUserRole.js admin@example.com');
    process.exit(1);
  }

  console.log(`\n🔍 Looking for user with email: ${email}`);
  console.log('   Note: User authentication is via Firebase Auth, but role metadata is in Supabase\n');

  try {
    // Find the user by email in Supabase users table
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      console.log('\n💡 Tip: The user must have logged in via Firebase Auth at least once');
      console.log('   so that their metadata is created in the Supabase users table.');
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.email}`);
    console.log(`   Current role: ${user.role || 'none'}`);
    console.log(`   Firebase UID: ${user.uid}\n`);

    // Update the user's role to admin in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('uid', user.uid);

    if (updateError) {
      console.error('❌ Error updating user role:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Successfully updated user role to "admin" in Supabase!\n');
    console.log('📝 Next steps:');
    console.log('   1. The user should log out and log back in');
    console.log('   2. They will now have full admin access to all pages\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

updateUserRole();
