require 'json'

Jekyll::Hooks.register :site, :post_write do |site|
  # Get all JSON files from the conversations directory
  conversation_files = Dir.glob(File.join(site.source, 'conversations', '*.json'))
  
  # Create array of conversation objects
  conversations = conversation_files.map do |file|
    {
      "name" => File.basename(file)
    }
  end

  # Write the conversations.json file
  File.write(File.join(site.dest, 'conversations.json'), JSON.pretty_generate(conversations))
end