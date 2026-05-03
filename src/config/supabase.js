const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://qeyuymprpmsqvukmdxfz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleXV5bXBycG1zcXZ1a21keGZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkxMDYyMywiZXhwIjoyMDg4NDg2NjIzfQ.-sbE12__iTQPxHLiAUOSBC1Qs1gyvjnt8t6GMqpy8sw"
);

module.exports = { supabase };