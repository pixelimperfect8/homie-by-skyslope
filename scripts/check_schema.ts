import { supabase } from '../lib/supabase';

async function checkSchema() {
  console.log('Checking database schema...\n');

  // Check conversations table
  const { data: conversationsInfo, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .limit(0);

  if (convError) {
    console.error('Error checking conversations table:', convError);
  } else {
    console.log('Conversations table exists with columns:', Object.keys(conversationsInfo?.length ? conversationsInfo[0] : {}));
  }

  // Check messages table
  const { data: messagesInfo, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .limit(0);

  if (msgError) {
    console.error('Error checking messages table:', msgError);
  } else {
    console.log('\nMessages table exists with columns:', Object.keys(messagesInfo?.length ? messagesInfo[0] : {}));
  }

  // Check foreign key relationship by attempting a join
  const { data: joinTest, error: joinError } = await supabase
    .from('conversations')
    .select(`
      id,
      messages (
        id
      )
    `)
    .limit(1);

  if (joinError) {
    console.error('\nError testing relationships:', joinError);
  } else {
    console.log('\nForeign key relationship test successful');
    console.log('Join result structure:', joinTest);
  }

  // Exit after checks
  process.exit(0);
}

checkSchema(); 