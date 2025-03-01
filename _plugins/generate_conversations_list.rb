require 'json'

module Jekyll
  class ConversationsGenerator < Generator
    safe true
    priority :high

    def generate(site)
      # Get all JSON files from the conversations directory
      conversations_dir = File.join(site.source, 'conversations')
      json_files = Dir[File.join(conversations_dir, '*.json')]
      
      # Create array of file names
      conversations = json_files.map do |file|
        { "name" => File.basename(file) }
      end

      # Create conversations.json in the site's destination directory
      File.write(File.join(site.dest, 'conversations.json'), JSON.pretty_generate(conversations))
    end
  end
end