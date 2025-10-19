// Bootstrap First Admin User
// This script adds an existing Firebase Auth user to Supabase as an admin
// Use this ONLY for the very first admin user setup

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function bootstrapAdmin() {
  const email = 'orionpaul@gmail.com';

  console.log('\n🔧 Bootstrapping First Admin User');
  console.log('====================================\n');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Note: This user must exist in Firebase Auth\n`);

  try {
    // Check if user already exists in Supabase
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ User already exists in Supabase');
      console.log(`   Current role: ${existingUsers[0].role}`);

      if (existingUsers[0].role === 'admin') {
        console.log('\n🎉 User is already an admin! No changes needed.\n');
        process.exit(0);
      }

      // Update to admin
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email);

      if (error) {
        console.error('❌ Error updating user:', error.message);
        process.exit(1);
      }

      console.log('\n✅ User role updated to admin!\n');
      process.exit(0);
    }

    // User doesn't exist in Supabase yet
    console.log('⚠️  User not found in Supabase users table\n');
    console.log('📝 This means the user hasn\'t logged in via Firebase Auth yet.\n');
    console.log('To fix this, you need to provide a Firebase UID.\n');

    // For bootstrap, we'll create with a placeholder UID that will be updated on first login
    console.log('💡 Creating user entry in Supabase...\n');

    // You need to manually get the UID from Firebase Console
    console.log('⚠️  MANUAL STEP REQUIRED:');
    console.log('   1. Go to Firebase Console → Authentication');
    console.log('   2. Find the user with email: orionpaul@gmail.com');
    console.log('   3. Copy their UID');
    console.log('   4. Run this command:\n');
    console.log('      node scripts/bootstrapFirstAdmin.js <FIREBASE_UID>\n');

    // Check if UID was provided as argument
    const uid = process.argv[2];
    if (!uid) {
      process.exit(1);
    }

    // Create user in Supabase with the provided UID
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        uid: uid,
        email: email,
        role: 'admin',
        created_by: 'bootstrap',
      }]);

    if (insertError) {
      console.error('❌ Error creating user:', insertError.message);
      process.exit(1);
    }

    console.log('✅ Successfully created admin user in Supabase!\n');
    console.log('📝 Next steps:');
    console.log('   1. Login at http://localhost:3000/admin/login');
    console.log('   2. You now have full admin access!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

bootstrapAdmin();
